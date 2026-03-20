package com.portfolio.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ── preflight ──────────────────────────────────────────────
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // ── auth ───────────────────────────────────────────────────
                .requestMatchers("/api/auth/**").permitAll()

                // ── master / controller login ──────────────────────────────
                .requestMatchers("/api/master-admin/login").permitAll()
                .requestMatchers("/api/master-admin/verify").permitAll()

                // ── PUBLIC: latest PDF for VersionPickerModal ──────────────
                .requestMatchers(HttpMethod.GET, "/api/master-admin/preview-pdfs/latest/**").permitAll()

                // ── PUBLIC: PDF view for iframe ────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/master-admin/preview-pdfs/*/view").permitAll()

                // ── payment ────────────────────────────────────────────────
                .requestMatchers("/api/payment/**").authenticated()

                // ── PUBLIC: portfolio viewer GETs ──────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/u/*/portfolio/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/u/*/projects").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/u/*/projects/featured").permitAll()

                // ── CONTROLLER: resume list-admin (accepts controller token)
                .requestMatchers(HttpMethod.GET, "/api/u/*/resume/list-admin").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/u/*/resume/*/view").authenticated()

                // ── PUBLIC: resume download ────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/u/*/resume/download").permitAll()

                // ── PUBLIC: profile-image viewer GETs ──────────────────────
                .requestMatchers(HttpMethod.GET, "/api/profile-image/**").permitAll()

                // ── ADMIN: projects ────────────────────────────────────────
                .requestMatchers(HttpMethod.POST,   "/api/u/*/projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/u/*/projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/u/*/projects/**").hasRole("ADMIN")

                // ── ADMIN: portfolio ───────────────────────────────────────
                .requestMatchers(HttpMethod.PUT,    "/api/u/*/portfolio/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/u/*/portfolio/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/u/*/portfolio/**").hasRole("ADMIN")

                // ── ADMIN: resume (non-admin-list GETs blocked above) ──────
                .requestMatchers(HttpMethod.POST,   "/api/u/*/resume/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/u/*/resume/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/u/*/resume/**").hasRole("ADMIN")

                // ── ADMIN: profile-image ───────────────────────────────────
                .requestMatchers(HttpMethod.POST,   "/api/profile-image/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/profile-image/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/profile-image/**").hasRole("ADMIN")

                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();

        cfg.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "https://portfolio-generator-by-gnanaseelan.vercel.app"
        ));

        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        cfg.setAllowedHeaders(List.of(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With"
        ));
        cfg.setExposedHeaders(List.of(
            "Content-Disposition",
            "Content-Type"
        ));
        cfg.setAllowCredentials(true);
        cfg.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
}