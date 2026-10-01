package com.odontorisas.persistence.entity;

import com.odontorisas.common.Role;
import com.odontorisas.common.UserStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Cuenta de acceso al sistema. La contraseña se guarda siempre como hash BCrypt.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    /**
     * Estado administrativo (capacidad {@code users}). Escribible: lo cambia
     * {@code UserAdminService} con la fila bloqueada, así Hibernate actualiza {@code updated_at}.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    /**
     * Bloqueo temporal por intentos fallidos: solo lectura. Lo modifican únicamente
     * los UPDATE atómicos de {@code UserRepository}; tras ellos no se relee aquí.
     */
    @Column(name = "failed_login_attempts", insertable = false, updatable = false, nullable = false)
    private int failedLoginAttempts;

    @Column(name = "locked_until", insertable = false, updatable = false)
    private Instant lockedUntil;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
