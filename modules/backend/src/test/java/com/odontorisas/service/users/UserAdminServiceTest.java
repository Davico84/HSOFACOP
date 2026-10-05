package com.odontorisas.service.users;

import com.odontorisas.common.Role;
import com.odontorisas.common.UserStatus;
import com.odontorisas.persistence.entity.User;
import com.odontorisas.persistence.repository.OrthodonticRecordRepository;
import com.odontorisas.persistence.repository.RefreshTokenRepository;
import com.odontorisas.persistence.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Reglas del cambio de estado (capacidad users), sin Spring ni BD. */
@ExtendWith(MockitoExtension.class)
class UserAdminServiceTest {

    @Mock UserRepository users;
    @Mock RefreshTokenRepository refreshTokens;
    @Mock OrthodonticRecordRepository records;

    UserAdminService service;

    @BeforeEach
    void setUp() {
        service = new UserAdminService(users, refreshTokens, records);
    }

    private static User account(Role role, UserStatus status) {
        return User.builder().id(2L).email("ana@empresa.test").fullName("Ana").passwordHash("h")
            .role(role).status(status).build();
    }

    @Test
    void disabling_a_user_changes_status_and_revokes_sessions() {
        User ana = account(Role.USER, UserStatus.ACTIVE);
        when(users.findByIdForUpdate(2L)).thenReturn(Optional.of(ana));

        UserSummaryView view = service.changeStatus(2L, UserStatus.DISABLED);

        assertThat(view.status()).isEqualTo(UserStatus.DISABLED);
        assertThat(ana.getStatus()).isEqualTo(UserStatus.DISABLED);
        verify(refreshTokens).revokeAllByUserId(2L);
    }

    @Test
    void reactivating_does_not_touch_sessions() {
        User ana = account(Role.USER, UserStatus.DISABLED);
        when(users.findByIdForUpdate(2L)).thenReturn(Optional.of(ana));

        assertThat(service.changeStatus(2L, UserStatus.ACTIVE).status()).isEqualTo(UserStatus.ACTIVE);
        verify(refreshTokens, never()).revokeAllByUserId(anyLong());
    }

    @Test
    void same_status_is_idempotent() {
        when(users.findByIdForUpdate(2L)).thenReturn(Optional.of(account(Role.USER, UserStatus.DISABLED)));

        assertThat(service.changeStatus(2L, UserStatus.DISABLED).status()).isEqualTo(UserStatus.DISABLED);
        verify(refreshTokens, never()).revokeAllByUserId(anyLong());
    }

    @Test
    void admin_account_is_409_whatever_the_status() {
        User admin = account(Role.ADMIN, UserStatus.ACTIVE);
        when(users.findByIdForUpdate(2L)).thenReturn(Optional.of(admin));

        for (UserStatus status : UserStatus.values()) {
            assertThatThrownBy(() -> service.changeStatus(2L, status))
                .isInstanceOf(AccountStatusNotChangeableException.class);
        }
        assertThat(admin.getStatus()).isEqualTo(UserStatus.ACTIVE);
        verify(refreshTokens, never()).revokeAllByUserId(anyLong());
    }

    @Test
    void missing_account_is_404() {
        when(users.findByIdForUpdate(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.changeStatus(99L, UserStatus.DISABLED))
            .isInstanceOf(UserNotFoundException.class);
    }

    // --- Cupo de historias (add-record-quota) ---

    @Test
    void setting_a_quota_on_a_user_stores_it_and_returns_the_count() {
        User ana = account(Role.USER, UserStatus.ACTIVE);
        when(users.findByIdForUpdate(2L)).thenReturn(Optional.of(ana));
        when(records.countByAuthorId(2L)).thenReturn(3L);

        UserSummaryView view = service.changeRecordQuota(2L, 2);

        assertThat(ana.getRecordQuota()).isEqualTo(2);
        assertThat(view.recordQuota()).isEqualTo(2);
        assertThat(view.recordCount()).isEqualTo(3L);
    }

    @Test
    void removing_the_quota_leaves_it_null() {
        User ana = account(Role.USER, UserStatus.ACTIVE);
        ana.setRecordQuota(5);
        when(users.findByIdForUpdate(2L)).thenReturn(Optional.of(ana));

        assertThat(service.changeRecordQuota(2L, null).recordQuota()).isNull();
        assertThat(ana.getRecordQuota()).isNull();
    }

    @Test
    void quota_does_not_apply_to_admin_accounts() {
        User admin = account(Role.ADMIN, UserStatus.ACTIVE);
        when(users.findByIdForUpdate(2L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service.changeRecordQuota(2L, 5)).isInstanceOf(QuotaNotApplicableException.class);
        assertThat(admin.getRecordQuota()).isNull();
    }

    @Test
    void quota_on_a_missing_account_is_not_found() {
        when(users.findByIdForUpdate(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.changeRecordQuota(9L, 5)).isInstanceOf(UserNotFoundException.class);
    }
}
