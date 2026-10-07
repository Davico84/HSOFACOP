package com.odontorisas.service.records;

import java.util.Optional;
import java.time.LocalDate;
import java.time.Clock;
import com.odontorisas.persistence.repository.RecordUnlockEventRepository;
import com.odontorisas.persistence.entity.RecordUnlockEvent;
import com.odontorisas.common.UnlockAction;
import com.odontorisas.common.Role;
import com.odontorisas.common.text.SearchNormalizer;
import com.odontorisas.persistence.entity.OrthodonticRecord;
import com.odontorisas.persistence.entity.User;
import com.odontorisas.persistence.repository.OrthodonticRecordRepository;
import com.odontorisas.persistence.repository.UserRepository;
import com.odontorisas.persistence.specification.OrthodonticRecordSpecifications;
import com.odontorisas.service.records.content.RecordContent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;
import java.sql.SQLException;
import java.util.List;

/**
 * Historias clínicas de ortodoncia (capacidad orthodontic-records). Aplica el alcance (D6): un
 * ADMIN alcanza todas; un USER solo las suyas, y una ajena se comporta como inexistente (404).
 * Normaliza antes de guardar (D4), exige un número de historia libre (409 si otra historia lo tiene)
 * y detecta ediciones concurrentes por versión (409).
 */
@Service
public class OrthodonticRecordService {

    /** Índice único del número: su violación (carrera entre dos guardados) es un número tomado. */
    static final String NUMBER_CONSTRAINT = "ux_orthodontic_records_record_number";

    private final OrthodonticRecordRepository records;
    private final UserRepository users;
    private final RecordAgeCalculator ages;
    private final JsonMapper json;
    private final RecordUnlockEventRepository unlockEvents;
    private final Clock clock;

    public OrthodonticRecordService(OrthodonticRecordRepository records, UserRepository users,
                                    RecordAgeCalculator ages, JsonMapper json,
                                    RecordUnlockEventRepository unlockEvents, Clock clock) {
        this.records = records;
        this.users = users;
        this.ages = ages;
        this.json = json;
        this.unlockEvents = unlockEvents;
        this.clock = clock;
    }

    /**
     * Crea la historia con el número indicado. La fila del autor queda bloqueada hasta el commit: dos
     * creaciones simultáneas del mismo usuario se serializan, así que tampoco pueden superar juntas
     * su cupo (un USER con cupo lleno recibe 409; un ADMIN no tiene cupo).
     */
    @Transactional
    public RecordView create(RecordActor actor, RecordData data) {
        return create(actor, data, null);
    }

    /** Crea la historia; {@code filledSteps} son los pasos con datos (el paso 1 siempre cuenta). */
    @Transactional
    public RecordView create(RecordActor actor, RecordData data, List<Integer> filledSteps) {
        User author = users.findByIdForUpdate(actor.userId())
            .orElseThrow(() -> new IllegalStateException("El usuario autenticado no existe"));
        Integer quota = quotaOf(author);
        if (quota != null && records.countByAuthorId(author.getId()) >= quota) {
            throw new RecordQuotaReachedException(quota);
        }
        RecordData normalized = normalize(data);
        requireFreeNumber(normalized.recordNumber(), null);
        OrthodonticRecord record = OrthodonticRecord.builder()
            .author(author)
            .build();
        apply(record, normalized);
        record.setFilledSteps(FilledSteps.toMask(filledSteps));
        if (record.getTreatingDentist() == null) {
            record.setTreatingDentist(author.getFullName());
        }
        return toView(saveAndFlush(record));
    }

    /** Cupo y uso del usuario autenticado (para avisar antes de crear). */
    @Transactional(readOnly = true)
    public RecordQuotaView quota(RecordActor actor) {
        User user = users.findById(actor.userId())
            .orElseThrow(() -> new IllegalStateException("El usuario autenticado no existe"));
        Integer quota = quotaOf(user);
        long used = records.countByAuthorId(user.getId());
        return new RecordQuotaView(quota, used, quota != null && used >= quota);
    }

    /** El cupo solo aplica a cuentas USER; un ADMIN nunca tiene límite. */
    private static Integer quotaOf(User user) {
        return user.getRole() == Role.USER ? user.getRecordQuota() : null;
    }

    @Transactional(readOnly = true)
    public RecordView get(RecordActor actor, Long id) {
        return toView(load(actor, id));
    }

    /**
     * Guarda la historia completa si sigue en la versión que el usuario cargó. El número puede
     * corregirse (el autor o un ADMIN); el autor no cambia nunca.
     */
    @Transactional
    public RecordView update(RecordActor actor, Long id, long expectedVersion, RecordData data) {
        return update(actor, id, expectedVersion, data, null, null);
    }

    @Transactional
    public RecordView update(RecordActor actor, Long id, long expectedVersion, RecordData data, Integer lastStep) {
        return update(actor, id, expectedVersion, data, lastStep, null);
    }

    /**
     * Guarda la historia; {@code lastStep} (1–8) es el paso en que se trabajó y {@code filledSteps}
     * los pasos con datos (el paso 1 siempre cuenta); nulos = no cambian.
     */
    @Transactional
    public RecordView update(RecordActor actor, Long id, long expectedVersion, RecordData data, Integer lastStep,
                             List<Integer> filledSteps) {
        OrthodonticRecord record = loadForUpdate(actor, id);
        if (record.getVersion() != expectedVersion) {
            throw new StaleRecordException();
        }
        RecordData normalized = normalize(data);
        // Datos del paciente fijos tras imprimir: se comparan en forma canónica bajo el bloqueo de fila.
        if (record.getPatientLockedAt() != null && !identityOf(record).equals(identityOf(normalized))) {
            throw new PatientLockedException();
        }
        requireFreeNumber(normalized.recordNumber(), record.getId());
        apply(record, normalized);
        if (lastStep != null) {
            record.setLastStep(lastStep);
        }
        if (filledSteps != null) {
            record.setFilledSteps(FilledSteps.toMask(filledSteps));
        }
        try {
            return toView(saveAndFlush(record));
        } catch (ObjectOptimisticLockingFailureException ex) {
            throw new StaleRecordException();
        }
    }

    /** 409 si otra historia ya tiene el número (el caso común; la carrera la resuelve el índice). */
    private void requireFreeNumber(String number, Long recordId) {
        if (records.existsNumberInOtherRecord(number, recordId)) {
            throw new RecordNumberTakenException(number);
        }
    }

    /**
     * Guarda y sincroniza con la base. Solo la violación del índice único del número (carrera
     * entre dos guardados de historias distintas) se traduce a 409; cualquier otra sigue su curso.
     */
    private OrthodonticRecord saveAndFlush(OrthodonticRecord record) {
        try {
            return records.saveAndFlush(record);
        } catch (DataIntegrityViolationException ex) {
            if (violates(ex, NUMBER_CONSTRAINT)) {
                throw new RecordNumberTakenException(record.getRecordNumber());
            }
            throw ex;
        }
    }

    /** ¿La causa es una violación de unicidad (SQLSTATE 23505) de esa restricción? */
    static boolean violates(Throwable ex, String constraint) {
        for (Throwable cause = ex; cause != null; cause = cause.getCause()) {
            if (cause instanceof SQLException sql && "23505".equals(sql.getSQLState())
                    && sql.getMessage() != null && sql.getMessage().contains(constraint)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Registra una impresión: la primera fija los datos del paciente (con el {@link Clock}); las
     * siguientes no cambian nada. Si la historia no tenía pasos calculados, guarda los enviados.
     */
    @Transactional
    public PrintView print(RecordActor actor, Long id, List<Integer> filledSteps) {
        OrthodonticRecord record = loadForUpdate(actor, id);
        if (record.getFilledSteps() == null && filledSteps != null) {
            record.setFilledSteps(FilledSteps.toMask(filledSteps));
        }
        if (record.getPatientLockedAt() == null) {
            record.setPatientLockedAt(clock.instant());
        }
        OrthodonticRecord saved = records.saveAndFlush(record);
        Integer mask = saved.getFilledSteps();
        Integer clinical = mask == null ? null : Integer.bitCount(mask & FilledSteps.CLINICAL_MASK);
        return new PrintView(toView(saved), LocalDate.now(clock), clinical);
    }

    /** El ADMIN desbloquea los datos fijos (cierra la solicitud pendiente) y queda registrado. */
    @Transactional
    public void unlockPatient(RecordActor admin, Long id) {
        OrthodonticRecord record = loadForUpdate(admin, id);
        if (record.getPatientLockedAt() == null) {
            throw new PatientNotLockedException();
        }
        recordEvent(admin, record, UnlockAction.UNLOCKED, record.getUnlockRequestReason());
        record.setPatientLockedAt(null);
        clearUnlockRequest(record);
        records.saveAndFlush(record);
    }

    /** El autor (o un ADMIN) solicita el desbloqueo de los datos fijos, con un motivo. */
    @Transactional
    public void requestUnlock(RecordActor actor, Long id, String reason) {
        OrthodonticRecord record = loadForUpdate(actor, id);
        if (record.getPatientLockedAt() == null) {
            throw new PatientNotLockedException();
        }
        if (record.getUnlockRequestedAt() != null) {
            throw new UnlockAlreadyRequestedException();
        }
        record.setUnlockRequestedAt(clock.instant());
        record.setUnlockRequestReason(reason.strip());
        records.saveAndFlush(record);
    }

    /** El ADMIN descarta la solicitud pendiente (sin solicitud no hace nada) y queda registrado. */
    @Transactional
    public void discardUnlockRequest(RecordActor admin, Long id) {
        OrthodonticRecord record = loadForUpdate(admin, id);
        if (record.getUnlockRequestedAt() == null) {
            return;
        }
        recordEvent(admin, record, UnlockAction.DISCARDED, record.getUnlockRequestReason());
        clearUnlockRequest(record);
        records.saveAndFlush(record);
    }

    private void recordEvent(RecordActor admin, OrthodonticRecord record, UnlockAction action, String reason) {
        unlockEvents.save(RecordUnlockEvent.builder()
            .record(record)
            .admin(users.getReferenceById(admin.userId()))
            .action(action)
            .reason(reason)
            .createdAt(clock.instant())
            .build());
    }

    private static void clearUnlockRequest(OrthodonticRecord record) {
        record.setUnlockRequestedAt(null);
        record.setUnlockRequestReason(null);
    }

    private static PatientIdentity identityOf(OrthodonticRecord r) {
        return PatientIdentity.of(r.getPatientName(), r.getDocumentType(), r.getDocumentNumber(), r.getBirthDate(),
            r.getPatientSex(), r.getBirthPlace());
    }

    private static PatientIdentity identityOf(RecordData d) {
        return PatientIdentity.of(d.patientName(), d.documentType(), d.documentNumber(), d.birthDate(),
            d.patientSex(), d.birthPlace());
    }

    /** Listado paginado; {@code query} busca en paciente, documento y número sin tildes ni mayúsculas. */
    @Transactional(readOnly = true)
    public Page<RecordSummaryView> list(RecordActor actor, String query, Pageable pageable) {
        Specification<OrthodonticRecord> spec = Specification.unrestricted();
        if (!actor.admin()) {
            spec = spec.and(OrthodonticRecordSpecifications.authoredBy(actor.userId()));
        }
        String term = SearchNormalizer.normalize(query);
        if (!term.isEmpty()) {
            spec = spec.and(OrthodonticRecordSpecifications.searchTextContains(term));
        }
        return records.findAll(spec, pageable).map(OrthodonticRecordService::toSummary);
    }

    /** Historia al alcance del actor, o 404 (sin revelar si existe). */
    private OrthodonticRecord load(RecordActor actor, Long id) {
        return inScope(actor, records.findWithAuthorById(id).orElseThrow(RecordNotFoundException::new));
    }

    /** Como {@link #load}, con la fila bloqueada hasta el commit. */
    private OrthodonticRecord loadForUpdate(RecordActor actor, Long id) {
        return inScope(actor, records.findByIdForUpdate(id).orElseThrow(RecordNotFoundException::new));
    }

    private static OrthodonticRecord inScope(RecordActor actor, OrthodonticRecord record) {
        if (!actor.admin() && !record.getAuthor().getId().equals(actor.userId())) {
            throw new RecordNotFoundException();
        }
        return record;
    }

    private RecordData normalize(RecordData data) {
        return RecordNormalizer.normalize(data, ages.ageYears(data.birthDate(), data.treatmentStartDate()));
    }

    private void apply(OrthodonticRecord record, RecordData data) {
        // El número va antes del texto de búsqueda, que lo incluye.
        record.setRecordNumber(data.recordNumber());
        record.setTreatingDentist(data.treatingDentist());
        record.setPatientName(data.patientName());
        record.setDocumentType(data.documentType());
        record.setDocumentNumber(data.documentNumber());
        record.setPatientSex(data.patientSex());
        record.setBirthDate(data.birthDate());
        record.setBirthPlace(data.birthPlace());
        record.setAddress(data.address());
        record.setPhone(data.phone());
        record.setTreatmentStartDate(data.treatmentStartDate());
        record.setContent(json.writeValueAsString(data.content()));
        record.setSearchText(searchText(data.patientName(), data.documentNumber(), record.getRecordNumber()));
    }

    static String searchText(String patientName, String documentNumber, String recordNumber) {
        String raw = String.join(" ", patientName, documentNumber == null ? "" : documentNumber, recordNumber);
        return SearchNormalizer.normalize(raw);
    }

    private RecordView toView(OrthodonticRecord r) {
        Integer age = ages.ageYears(r.getBirthDate(), r.getTreatmentStartDate());
        RecordContent stored = json.readValue(r.getContent(), RecordContent.class);
        RecordContent content = RecordNormalizer.content(stored, r.getPatientSex(), age);
        Optional<RecordUnlockEvent> lastUnlock = r.getId() == null ? Optional.empty()
            : unlockEvents.findFirstByRecordIdAndActionOrderByCreatedAtDescIdDesc(r.getId(), UnlockAction.UNLOCKED);
        return new RecordView(r.getId(), r.getRecordNumber(), r.getAuthor().getId(), r.getAuthor().getFullName(),
            r.getTreatingDentist(), r.getPatientName(), r.getDocumentType(), r.getDocumentNumber(), r.getPatientSex(),
            r.getBirthDate(), r.getBirthPlace(), r.getAddress(), r.getPhone(), r.getTreatmentStartDate(), age,
            content, r.getLastStep(), FilledSteps.toList(r.getFilledSteps()), r.getPatientLockedAt(),
            lastUnlock.map(e -> e.getAdmin().getFullName()).orElse(null),
            lastUnlock.map(RecordUnlockEvent::getCreatedAt).orElse(null), r.getUnlockRequestedAt(),
            r.getUnlockRequestReason(), r.getVersion(), r.getCreatedAt(), r.getUpdatedAt());
    }

    private static RecordSummaryView toSummary(OrthodonticRecord r) {
        return new RecordSummaryView(r.getId(), r.getRecordNumber(), r.getPatientName(), r.getDocumentType(),
            r.getDocumentNumber(), r.getTreatingDentist(), r.getTreatmentStartDate(), r.getAuthor().getFullName(),
            r.getUpdatedAt(), r.getPatientLockedAt() != null);
    }
}
