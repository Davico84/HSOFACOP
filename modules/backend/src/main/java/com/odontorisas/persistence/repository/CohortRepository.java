package com.odontorisas.persistence.repository;

import com.odontorisas.persistence.entity.Cohort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CohortRepository extends JpaRepository<Cohort, Long> {

    /** ¿Otra turma (distinta de {@code id}; nulo al crear) ya tiene este nombre normalizado? */
    @Query("select count(c) > 0 from Cohort c where c.nameKey = :nameKey and (:id is null or c.id <> :id)")
    boolean existsNameKeyInOther(@Param("nameKey") String nameKey, @Param("id") Long id);

    /** Turma por su código de inscripción (ya normalizado). */
    Optional<Cohort> findByRegistrationCode(String registrationCode);

    /** Todas las turmas con su código, si están abiertas y sus alumnos y coordinaciones, por nombre. */
    @Query("select c.id as id, c.name as name, c.registrationCode as registrationCode,"
        + " c.registrationOpen as registrationOpen,"
        + " (select count(u) from User u where u.cohort = c) as students,"
        + " (select count(k) from User k join k.coordinatorCohorts kc where kc = c) as coordinators"
        + " from Cohort c order by c.nameKey, c.id")
    List<CohortCounts> findAllWithCounts();

    /** Ids de las turmas que supervisa una cuenta (leídas en cada petición: un cambio vale al instante). */
    @Query("select c.id from User u join u.coordinatorCohorts c where u.id = :userId")
    List<Long> findCoordinatorCohortIds(@Param("userId") Long userId);

    /** Turmas que supervisa una cuenta, por nombre. */
    @Query("select c from User u join u.coordinatorCohorts c where u.id = :userId order by c.nameKey, c.id")
    List<Cohort> findCoordinatorCohorts(@Param("userId") Long userId);

    /** Turmas de coordinación de una página de cuentas, en una sola consulta (sin N+1). */
    @Query("select u.id as userId, c.id as cohortId, c.name as cohortName from User u join u.coordinatorCohorts c"
        + " where u.id in :userIds order by c.nameKey, c.id")
    List<CoordinatorCohortRow> findCoordinatorCohortsOf(@Param("userIds") Collection<Long> userIds);

    /** Proyección de {@link #findAllWithCounts}. */
    interface CohortCounts {
        Long getId();

        String getName();

        String getRegistrationCode();

        boolean isRegistrationOpen();

        long getStudents();

        long getCoordinators();
    }

    /** Proyección de {@link #findCoordinatorCohortsOf}. */
    interface CoordinatorCohortRow {
        Long getUserId();

        Long getCohortId();

        String getCohortName();
    }
}
