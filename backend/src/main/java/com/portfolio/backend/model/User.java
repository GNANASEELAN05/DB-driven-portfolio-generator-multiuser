package com.portfolio.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;

    private String password;
    private String role; // ADMIN

    // ─── PREMIUM VERSION FLAGS ──────────────────────────────────────
    @Column(name = "has_premium1", nullable = false, columnDefinition = "boolean default false")
    private boolean hasPremium1 = false;

    @Column(name = "has_premium2", nullable = false, columnDefinition = "boolean default false")
    private boolean hasPremium2 = false;
    // ────────────────────────────────────────────────────────────────

    public User() {}

    public User(String username, String password, String role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    public Long getId()           { return id; }
    public String getUsername()   { return username; }
    public String getPassword()   { return password; }
    public String getRole()       { return role; }
    public boolean isHasPremium1(){ return hasPremium1; }
    public boolean isHasPremium2(){ return hasPremium2; }

    public void setUsername(String username)   { this.username = username; }
    public void setPassword(String password)   { this.password = password; }
    public void setRole(String role)           { this.role = role; }
    public void setHasPremium1(boolean v)      { this.hasPremium1 = v; }
    public void setHasPremium2(boolean v)      { this.hasPremium2 = v; }
}