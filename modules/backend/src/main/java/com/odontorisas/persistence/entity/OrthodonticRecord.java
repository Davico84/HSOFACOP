package com.odontorisas.persistence.entity;

import com.odontorisas.common.DocumentType;
import com.odontorisas.common.PatientSex;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OptimisticLock;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Historia clínica de ortodoncia (capacidad orthodontic-records). Columnas para lo que se lista
 * o busca; el contenido clínico es JSON (columna JSONB) que serializa el service: la persistencia
 * no conoce su forma.
 */
@Entity
@Table(name = "orthodontic_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrthodonticRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Autor: nunca cambia, ni cuando guarda un ADMIN. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false, updatable = false)
    private User author;

    /**
     * Número que asignan los docentes ({@code AOC-0001}): único entre todas las historias
     * (índice {@code ux_orthodontic_records_record_number}); lo corrigen el autor o un ADMIN.
     */
    @Column(name = "record_number", nullable = false, length = 20)
    private String recordNumber;

    @Column(name = "treating_dentist", length = 120)
    private String treatingDentist;

    @Column(name = "patient_name", nullable = false, length = 120)
    private String patientName;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", length = 20)
    private DocumentType documentType;

    @Column(name = "document_number", length = 12)
    private String documentNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "patient_sex", length = 10)
    private PatientSex patientSex;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "birth_place", length = 120)
    private String birthPlace;

    @Column(length = 200)
    private String address;

    @Column(length = 20)
    private String phone;

    @Column(name = "treatment_start_date")
    private LocalDate treatmentStartDate;

    /** Nombre + documento + número en minúsculas y sin tildes (búsqueda). */
    @Column(name = "search_text", nullable = false, length = 400)
    private String searchText;

    /** Contenido clínico serializado (JSON). */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String content;

    /** Último paso del formulario (1–8) en que se guardaron cambios; nulo = paso 1. */
    @Column(name = "last_step")
    private Integer lastStep;

    /**
     * Primera impresión registrada: desde entonces los datos del paciente quedan fijos (nulo =
     * desbloqueada). No cuenta para la versión: imprimir o desbloquear no deja desactualizado el
     * formulario abierto; la concurrencia con los guardados la resuelve el bloqueo de fila.
     */
    @OptimisticLock(excluded = true)
    @Column(name = "patient_locked_at")
    private Instant patientLockedAt;

    /** Solicitud de desbloqueo pendiente del tratante (nulo = ninguna). No cuenta para la versión. */
    @OptimisticLock(excluded = true)
    @Column(name = "unlock_requested_at")
    private Instant unlockRequestedAt;

    @OptimisticLock(excluded = true)
    @Column(name = "unlock_request_reason", length = 200)
    private String unlockRequestReason;

    /** Pasos con datos como máscara de bits (bit n-1 = paso n); nulo = sin calcular. */
    @Column(name = "filled_steps")
    private Integer filledSteps;

    @Version
    @Column(nullable = false)
    private long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
