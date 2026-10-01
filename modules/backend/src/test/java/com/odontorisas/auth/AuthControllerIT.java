package com.odontorisas.auth;

import com.odontorisas.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Scenarios de la capacidad authentication a nivel HTTP (contra PostgreSQL real
 * vía Testcontainers). Se salta sin Docker; corre en CI.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIT extends AbstractIntegrationTest {

    private static final String REFRESH_COOKIE = "refresh_token";

    @Autowired
    MockMvc mockMvc;

    private String registerBody(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\",\"fullName\":\"Ana Pérez\"}";
    }

    @Test
    void register_success_returns_201_with_token_and_refresh_cookie() throws Exception {
        mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(registerBody("nuevo@clinica.test", "password123")))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.user.email").value("nuevo@clinica.test"))
            .andExpect(jsonPath("$.user.role").value("USER"))
            .andExpect(cookie().exists(REFRESH_COOKIE))
            .andExpect(cookie().httpOnly(REFRESH_COOKIE, true))
            .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("SameSite=Lax")));
    }

    @Test
    void register_duplicate_email_returns_409() throws Exception {
        String body = registerBody("dup@clinica.test", "password123");
        mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());
        mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isConflict());
    }

    @Test
    void register_short_password_returns_400() throws Exception {
        mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(registerBody("corta@clinica.test", "1234")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors").isArray())
            .andExpect(jsonPath("$.errors[?(@.field == 'password')]").isNotEmpty());
    }

    @Test
    void login_valid_credentials_returns_200() throws Exception {
        String email = "login@clinica.test";
        mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(registerBody(email, "password123")))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(registerBody(email, "password123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(cookie().exists(REFRESH_COOKIE));
    }

    @Test
    void login_invalid_credentials_returns_401_generic() throws Exception {
        mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(registerBody("noexiste@clinica.test", "password123")))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.detail").value("Correo electrónico o contraseña incorrectos"));
    }

    @Test
    void login_missing_fields_returns_400() throws Exception {
        mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"\",\"password\":\"\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void refresh_with_valid_cookie_returns_200_and_rotates() throws Exception {
        MvcResult registered = mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(registerBody("refresh@clinica.test", "password123")))
            .andExpect(status().isCreated())
            .andReturn();
        Cookie refresh = registered.getResponse().getCookie(REFRESH_COOKIE);
        assertThat(refresh).isNotNull();

        mockMvc.perform(post("/auth/refresh").cookie(refresh))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(cookie().exists(REFRESH_COOKIE));
    }

    @Test
    void refresh_without_cookie_returns_401() throws Exception {
        mockMvc.perform(post("/auth/refresh"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_returns_204_and_clears_cookie() throws Exception {
        MvcResult registered = mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(registerBody("logout@clinica.test", "password123")))
            .andExpect(status().isCreated())
            .andReturn();
        Cookie refresh = registered.getResponse().getCookie(REFRESH_COOKIE);

        mockMvc.perform(post("/auth/logout").cookie(refresh))
            .andExpect(status().isNoContent())
            .andExpect(cookie().maxAge(REFRESH_COOKIE, 0));
    }

    @Test
    void protected_route_without_token_returns_401() throws Exception {
        mockMvc.perform(get("/users/me"))
            .andExpect(status().isUnauthorized());
    }

    /**
     * Regresión: el 401 de "sin token" salía con el cuerpo por defecto del contenedor
     * ({@code sendError}), sin forma RFC 9457 — distinto del resto de errores de la API.
     */
    @Test
    void protected_route_without_token_returns_rfc9457_body() throws Exception {
        mockMvc.perform(get("/users/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.type").value("/errors/unauthorized"))
            .andExpect(jsonPath("$.detail").value("Necesitas iniciar sesión para acceder a este recurso."));
    }
}
