package com.odontorisas.service.users;

import com.odontorisas.persistence.entity.User;
import com.odontorisas.persistence.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * "Mis datos" (capacidad {@code users}): la cuenta autenticada lee y cambia sus propios datos de
 * contacto e identificación. El id llega del token, nunca de la petición, así que no hay forma de
 * leer o cambiar los de otra cuenta. Los datos no se escriben en el log.
 */
@Service
public class ProfileService {

    private static final Logger log = LoggerFactory.getLogger(ProfileService.class);

    private final UserRepository users;

    public ProfileService(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public ProfileView get(Long userId) {
        return toView(users.findById(userId).orElseThrow(UserNotFoundException::new));
    }

    /** Reemplaza celular, documento y COP (un {@code null} quita el dato), con la fila bloqueada. */
    @Transactional
    public ProfileView update(Long userId, ContactData contact) {
        User user = users.findByIdForUpdate(userId).orElseThrow(UserNotFoundException::new);
        contact.applyTo(user);
        users.flush();
        log.info("Cuenta {}: datos de contacto actualizados", userId);
        return toView(user);
    }

    private static ProfileView toView(User user) {
        return new ProfileView(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), ContactData.of(user));
    }
}
