package com.odontorisas.infra.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.odontorisas.common.Role;
import com.odontorisas.persistence.entity.User;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Emisión y validación de tokens. El access token es un JWT HS256 (stateless);
 * el refresh token es un valor aleatorio opaco cuyo <em>hash</em> se persiste
 * (nunca el valor en claro).
 */
@Service
public class TokenService {

    private final SecurityProperties props;
    private final Algorithm algorithm;
    private final SecureRandom secureRandom = new SecureRandom();

    public TokenService(SecurityProperties props) {
        // Sin ninguna propiedad app.security.jwt.* el binder deja jwt() en null: se valida
        // igual (mensaje "obligatorio") en vez de fallar con un NullPointerException.
        String secret = props.jwt() == null ? null : props.jwt().secret();
        JwtSecretRules.validate(secret);
        this.props = props;
        this.algorithm = Algorithm.HMAC256(secret);
    }

    /** Emite un access token JWT firmado (HS256) con el id, email y rol del usuario. */
    public String issueAccessToken(User user) {
        Instant now = Instant.now();
        return JWT.create()
            .withIssuer(props.jwt().issuer())
            .withSubject(String.valueOf(user.getId()))
            .withClaim("email", user.getEmail())
            .withClaim("role", user.getRole().name())
            .withIssuedAt(now)
            .withExpiresAt(now.plus(props.jwt().accessTtl()))
            .sign(algorithm);
    }

    /** Valida el access token y extrae sus claims. Lanza {@link com.auth0.jwt.exceptions.JWTVerificationException} si es inválido/expirado. */
    public AccessClaims verifyAccessToken(String token) {
        DecodedJWT jwt = JWT.require(algorithm).withIssuer(props.jwt().issuer()).build().verify(token);
        return new AccessClaims(
            Long.valueOf(jwt.getSubject()),
            jwt.getClaim("email").asString(),
            Role.valueOf(jwt.getClaim("role").asString()));
    }

    /** Genera el valor en claro de un refresh token (opaco, aleatorio). */
    public String generateRefreshTokenValue() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Hash SHA-256 (hex) del refresh token; es lo único que se persiste. */
    public String hashRefreshToken(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }

    /** Instante de expiración de un nuevo refresh token. */
    public Instant refreshExpiry() {
        return Instant.now().plus(props.jwt().refreshTtl());
    }
}
