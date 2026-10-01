package com.odontorisas.persistence.repository;

import com.odontorisas.persistence.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /**
     * Registra un login fallido en un único UPDATE atómico (nunca leer-incrementar-guardar:
     * bajo concurrencia pierde escrituras). Si el bloqueo anterior ya expiró, el conteo
     * reinicia a 1; al alcanzar {@code maxAttempts}, bloquea hasta {@code until}.
     */
    @Modifying
    @Query(value = """
        UPDATE users
        SET failed_login_attempts = CASE
              WHEN locked_until IS NOT NULL AND locked_until <= CAST(:now AS timestamptz) THEN 1
              ELSE failed_login_attempts + 1 END,
            locked_until = CASE
              WHEN locked_until IS NOT NULL AND locked_until <= CAST(:now AS timestamptz)
                THEN CASE WHEN 1 >= :maxAttempts THEN CAST(:until AS timestamptz) ELSE NULL END
              WHEN failed_login_attempts + 1 >= :maxAttempts THEN CAST(:until AS timestamptz)
              ELSE locked_until END
        WHERE id = :id
        """, nativeQuery = true)
    int registerFailedLogin(@Param("id") Long id,
                            @Param("now") Instant now,
                            @Param("until") Instant until,
                            @Param("maxAttempts") int maxAttempts);

    /**
     * Resetea el contador tras un login correcto, solo si la cuenta sigue activa y no está
     * bloqueada en {@code now}. Devuelve 0 si otra petición la bloqueó o la deshabilitó mientras
     * tanto: en ese caso no se emiten tokens.
     */
    @Modifying
    @Query(value = """
        UPDATE users SET failed_login_attempts = 0, locked_until = NULL
        WHERE id = :id
          AND status = 'ACTIVE'
          AND (locked_until IS NULL OR locked_until <= CAST(:now AS timestamptz))
        """, nativeQuery = true)
    int resetFailedLogins(@Param("id") Long id, @Param("now") Instant now);

    /**
     * Carga la cuenta con la fila bloqueada ({@code SELECT … FOR UPDATE}): el cambio de estado
     * decide 404/409 y escribe sobre una lectura que no puede quedar obsoleta.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Long id);
}
