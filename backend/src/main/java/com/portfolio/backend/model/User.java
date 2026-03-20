package com.portfolio.backend.model;

// FILE LOCATION: backend/src/main/java/com/portfolio/backend/model/User.java

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    private String role; // "ADMIN"

    // ── Email (optional, shown in controller dashboard) ──────────────────────
    @Column(unique = true)
    private String email;

    // ── Account enabled flag ─────────────────────────────────────────────────
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean enabled = true;

    // ── Timestamps ───────────────────────────────────────────────────────────
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    // ── PREMIUM VERSION FLAGS ─────────────────────────────────────────────────
    @Column(name = "has_premium1", nullable = false, columnDefinition = "boolean default false")
    private boolean hasPremium1 = false;

    @Column(name = "has_premium2", nullable = false, columnDefinition = "boolean default false")
    private boolean hasPremium2 = false;

    // ─────────────────────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (!enabled) enabled = true;
    }

    // ── Constructors ─────────────────────────────────────────────────────────

    public User() {}

    public User(String username, String password, String role) {
        this.username = username;
        this.password = password;
        this.role     = role;
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    public Long          getId()           { return id; }
    public String        getUsername()     { return username; }
    public String        getPassword()     { return password; }
    public String        getRole()         { return role; }
    public String        getEmail()        { return email; }
    public boolean       isEnabled()       { return enabled; }
    public LocalDateTime getCreatedAt()    { return createdAt; }
    public LocalDateTime getLastLogin()    { return lastLogin; }
    public boolean       isHasPremium1()   { return hasPremium1; }
    public boolean       isHasPremium2()   { return hasPremium2; }

    // ── Setters ──────────────────────────────────────────────────────────────

    public void setId(Long id)                   { this.id = id; }
    public void setUsername(String username)     { this.username = username; }
    public void setPassword(String password)     { this.password = password; }
    public void setRole(String role)             { this.role = role; }
    public void setEmail(String email)           { this.email = email; }
    public void setEnabled(boolean enabled)      { this.enabled = enabled; }
    public void setCreatedAt(LocalDateTime v)    { this.createdAt = v; }
    public void setLastLogin(LocalDateTime v)    { this.lastLogin = v; }
    public void setHasPremium1(boolean v)        { this.hasPremium1 = v; }
    public void setHasPremium2(boolean v)        { this.hasPremium2 = v; }
}