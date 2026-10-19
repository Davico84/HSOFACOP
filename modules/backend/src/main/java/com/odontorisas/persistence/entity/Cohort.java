package com.odontorisas.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

import java.time.Instant;

/**
 * Turma (capacidad {@code cohorts}): agrupa alumnos y define el alcance de la coordinación.
 * {@code nameKey} es el nombre normalizado que hace único al nombre; lo fija {@code CohortService}.
 */
@Entity
@Table(name = "cohorts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cohort {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "name_key", nullable = false, length = 80)
    private String nameKey;

    /** Código de inscripción (8 caracteres sin 0/O/1/I, sin guion), único. Lo genera {@code CohortService}. */
    @Column(name = "registration_code", nullable = false, length = 8)
    private String registrationCode;

    /** Abierta = su código acepta registros. */
    @Column(name = "registration_open", nullable = false)
    @Builder.Default
    private boolean registrationOpen = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
