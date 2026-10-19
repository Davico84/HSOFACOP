package com.odontorisas.service.cohorts;

import com.odontorisas.common.Role;
import com.odontorisas.persistence.entity.Cohort;
import com.odontorisas.persistence.repository.CohortRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.List;
import java.util.Locale;

/**
 * Turmas (capacidad {@code cohorts}). El nombre se guarda sin espacios sobrantes y es único sin
 * distinguir mayúsculas ni espacios ({@code name_key}): el caso común se responde con 409 antes de
 * escribir y la carrera entre dos guardados la resuelve el índice único. Cada turma tiene un código
 * de inscripción ({@link CohortCodes}) y nace abierta. La autorización la aplica {@code CohortsController}.
 */
@Service
public class CohortService {

    /** Índice único del nombre normalizado. */
    static final String NAME_CONSTRAINT = "ux_cohorts_name_key";

    /** Intentos para dar con un código libre (una colisión es muy improbable: 32⁸ combinaciones). */
    static final int CODE_ATTEMPTS = 3;

    private static final Logger log = LoggerFactory.getLogger(CohortService.class);

    private final CohortRepository cohorts;

    public CohortService(CohortRepository cohorts) {
        this.cohorts = cohorts;
    }

    /** ADMIN: todas, con conteos, código y estado. COORDINATOR: solo las suyas (leídas de la base), con id y nombre. */
    @Transactional(readOnly = true)
    public List<CohortView> list(Long userId, Role role) {
        if (role == Role.COORDINATOR) {
            return cohorts.findCoordinatorCohorts(userId).stream()
                .map(c -> CohortView.reference(c.getId(), c.getName()))
                .toList();
        }
        return cohorts.findAllWithCounts().stream().map(CohortService::toView).toList();
    }

    @Transactional
    public CohortView create(String name) {
        String clean = clean(name);
        requireFreeName(clean, null);
        Cohort saved = save(Cohort.builder().name(clean).nameKey(key(clean)).registrationCode(freeCode()).build());
        log.info("Turma {} creada", saved.getId());
        return adminView(saved.getId());
    }

    /** Renombra (404 si no existe, 409 si otra turma ya tiene el nombre); alumnos y coordinaciones siguen en ella. */
    @Transactional
    public CohortView rename(Long id, String name) {
        Cohort cohort = cohorts.findById(id).orElseThrow(CohortNotFoundException::new);
        String clean = clean(name);
        requireFreeName(clean, id);
        cohort.setName(clean);
        cohort.setNameKey(key(clean));
        save(cohort);
        log.info("Turma {} renombrada", id);
        return adminView(id);
    }

    /** Código nuevo (404 si no existe): desde ahora el anterior no sirve para registrarse. */
    @Transactional
    public CohortView regenerateCode(Long id) {
        Cohort cohort = cohorts.findById(id).orElseThrow(CohortNotFoundException::new);
        cohort.setRegistrationCode(freeCode());
        save(cohort);
        log.info("Turma {}: código de inscripción nuevo", id);
        return adminView(id);
    }

    /** Abre o cierra la inscripción (404 si no existe); no toca alumnos ni coordinaciones. */
    @Transactional
    public CohortView setRegistrationOpen(Long id, boolean open) {
        Cohort cohort = cohorts.findById(id).orElseThrow(CohortNotFoundException::new);
        cohort.setRegistrationOpen(open);
        save(cohort);
        log.info("Turma {}: inscripción {}", id, open ? "abierta" : "cerrada");
        return adminView(id);
    }

    /**
     * Turma en la que se inscribe quien se registra con ese código (ya normalizado): 400 si no es de
     * ninguna turma o si la turma está cerrada.
     */
    @Transactional(readOnly = true)
    public Cohort forRegistration(String code) {
        Cohort cohort = cohorts.findByRegistrationCode(code).orElseThrow(InvalidCohortCodeException::new);
        if (!cohort.isRegistrationOpen()) {
            throw new CohortRegistrationClosedException();
        }
        return cohort;
    }

    /** Un código que ninguna turma usa; el índice único queda como última barrera ante una carrera. */
    private String freeCode() {
        for (int attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
            String code = CohortCodes.generate();
            if (cohorts.findByRegistrationCode(code).isEmpty()) {
                return code;
            }
        }
        throw new IllegalStateException("No se encontró un código de turma libre");
    }

    private CohortView adminView(Long id) {
        return cohorts.findAllWithCounts().stream()
            .filter(c -> c.getId().equals(id))
            .map(CohortService::toView)
            .findFirst()
            .orElseThrow(CohortNotFoundException::new);
    }

    private static CohortView toView(CohortRepository.CohortCounts c) {
        return new CohortView(c.getId(), c.getName(), c.getStudents(), c.getCoordinators(), c.getRegistrationCode(),
            c.isRegistrationOpen());
    }

    private void requireFreeName(String clean, Long id) {
        if (cohorts.existsNameKeyInOther(key(clean), id)) {
            throw new CohortNameTakenException();
        }
    }

    private Cohort save(Cohort cohort) {
        try {
            return cohorts.saveAndFlush(cohort);
        } catch (DataIntegrityViolationException ex) {
            if (violatesName(ex)) {
                throw new CohortNameTakenException();
            }
            throw ex;
        }
    }

    /** ¿La causa es una violación de unicidad (SQLSTATE 23505) del nombre? */
    private static boolean violatesName(Throwable ex) {
        for (Throwable cause = ex; cause != null; cause = cause.getCause()) {
            if (cause instanceof SQLException sql && "23505".equals(sql.getSQLState())
                    && sql.getMessage() != null && sql.getMessage().contains(NAME_CONSTRAINT)) {
                return true;
            }
        }
        return false;
    }

    /** Sin espacios al inicio ni al final y con los interiores colapsados a uno. */
    static String clean(String name) {
        return name.strip().replaceAll("\\s+", " ");
    }

    /** Nombre normalizado para la unicidad: limpio y en minúsculas. */
    static String key(String clean) {
        return clean.toLowerCase(Locale.ROOT);
    }
}
