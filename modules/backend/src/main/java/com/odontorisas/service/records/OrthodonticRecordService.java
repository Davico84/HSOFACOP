package com.odontorisas.service.records;

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
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

/**
 * Historias clínicas de ortodoncia (capacidad orthodontic-records). Aplica el alcance (D6): un
 * ADMIN alcanza todas; un USER solo las suyas, y una ajena se comporta como inexistente (404).
 * Normaliza antes de guardar (D4), asigna el correlativo por autor (D11) y detecta ediciones
 * concurrentes por versión (409).
 */
@Service
public class OrthodonticRecordService {

    /** {@code AEO-001}; desde 1000 sigue con las cifras que hagan falta. */
    static final String NUMBER_FORMAT = "AEO-%03d";

    private final OrthodonticRecordRepository records;
    private final UserRepository users;
    private final RecordAgeCalculator ages;
    private final JsonMapper json;

    public OrthodonticRecordService(OrthodonticRecordRepository records, UserRepository users,
                                    RecordAgeCalculator ages, JsonMapper json) {
        this.records = records;
        this.users = users;
        this.ages = ages;
        this.json = json;
    }

    /**
     * Crea la historia con el siguiente correlativo del autor. La fila del autor queda bloqueada
     * hasta el commit: dos creaciones simultáneas del mismo usuario se serializan, así que tampoco
     * pueden superar juntas su cupo (un USER con cupo lleno recibe 409; un ADMIN no tiene cupo).
     */
    @Transactional
    public RecordView create(RecordActor actor, RecordData data) {
        User author = users.findByIdForUpdate(actor.userId())
            .orElseThrow(() -> new IllegalStateException("El usuario autenticado no existe"));
        Integer quota = quotaOf(author);
        if (quota != null && records.countByAuthorId(author.getId()) >= quota) {
            throw new RecordQuotaReachedException(quota);
        }
        int seq = records.findMaxRecordSeq(author.getId()) + 1;
        RecordData normalized = normalize(data);
        OrthodonticRecord record = OrthodonticRecord.builder()
            .author(author)
            .recordSeq(seq)
            .recordNumber(NUMBER_FORMAT.formatted(seq))
            .build();
        apply(record, normalized);
        if (record.getTreatingDentist() == null) {
            record.setTreatingDentist(author.getFullName());
        }
        return toView(records.saveAndFlush(record));
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
     * Guarda la historia completa si sigue en la versión que el usuario cargó. El número y el
     * autor no cambian nunca (tampoco cuando guarda un ADMIN).
     */
    @Transactional
    public RecordView update(RecordActor actor, Long id, long expectedVersion, RecordData data) {
        OrthodonticRecord record = load(actor, id);
        if (record.getVersion() != expectedVersion) {
            throw new StaleRecordException();
        }
        apply(record, normalize(data));
        try {
            return toView(records.saveAndFlush(record));
        } catch (ObjectOptimisticLockingFailureException ex) {
            throw new StaleRecordException();
        }
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
        OrthodonticRecord record = records.findWithAuthorById(id).orElseThrow(RecordNotFoundException::new);
        if (!actor.admin() && !record.getAuthor().getId().equals(actor.userId())) {
            throw new RecordNotFoundException();
        }
        return record;
    }

    private RecordData normalize(RecordData data) {
        return RecordNormalizer.normalize(data, ages.ageYears(data.birthDate(), data.treatmentStartDate()));
    }

    private void apply(OrthodonticRecord record, RecordData data) {
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
        return new RecordView(r.getId(), r.getRecordNumber(), r.getAuthor().getId(), r.getAuthor().getFullName(),
            r.getTreatingDentist(), r.getPatientName(), r.getDocumentType(), r.getDocumentNumber(), r.getPatientSex(),
            r.getBirthDate(), r.getBirthPlace(), r.getAddress(), r.getPhone(), r.getTreatmentStartDate(), age,
            content, r.getVersion(), r.getCreatedAt(), r.getUpdatedAt());
    }

    private static RecordSummaryView toSummary(OrthodonticRecord r) {
        return new RecordSummaryView(r.getId(), r.getRecordNumber(), r.getPatientName(), r.getDocumentType(),
            r.getDocumentNumber(), r.getTreatingDentist(), r.getTreatmentStartDate(), r.getAuthor().getFullName(),
            r.getUpdatedAt());
    }
}
