package com.odontorisas.persistence.entity;

import com.odontorisas.common.UnlockAction;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Desbloqueo o descarte de solicitud hecho por un ADMIN sobre una historia. Solo se inserta. */
@Entity
@Table(name = "record_unlock_events")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordUnlockEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "record_id", nullable = false)
    private OrthodonticRecord record;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UnlockAction action;

    /** Motivo de la solicitud que se resolvió (nulo si no había). */
    @Column(length = 200)
    private String reason;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
