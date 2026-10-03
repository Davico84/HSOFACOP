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

    /** Correlativo del autor (1, 2, …): único por autor. */
    @Column(name = "record_seq", nullable = false, updatable = false)
    private int recordSeq;

    /** {@code AEO-001}: derivado de {@code recordSeq}, guardado para listar y buscar. */
    @Column(name = "record_number", nullable = false, updatable = false, length = 20)
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
