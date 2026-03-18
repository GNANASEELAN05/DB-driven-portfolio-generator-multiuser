package com.portfolio.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(
        name = "achievements",
        indexes = {
                @Index(name = "idx_ach_owner", columnList = "ownerUsername")
        }
)
public class AchievementItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ownerUsername;

    private String title;
    private String issuer;
    private String date;
    private String year;   // keep for frontend compat

    @Column(length = 4000)
    private String description;

    private String link;

    // ── Certificate fields ──────────────────────────────────
    private String certificateFileName;
    private String certificateContentType;

    @Lob
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "certificate_data")
    private byte[] certificateData;
    // ────────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOwnerUsername() { return ownerUsername; }
    public void setOwnerUsername(String ownerUsername) { this.ownerUsername = ownerUsername; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getIssuer() { return issuer; }
    public void setIssuer(String issuer) { this.issuer = issuer; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }

    public String getCertificateFileName() { return certificateFileName; }
    public void setCertificateFileName(String certificateFileName) { this.certificateFileName = certificateFileName; }

    public String getCertificateContentType() { return certificateContentType; }
    public void setCertificateContentType(String certificateContentType) { this.certificateContentType = certificateContentType; }

    public byte[] getCertificateData() { return certificateData; }
    public void setCertificateData(byte[] certificateData) { this.certificateData = certificateData; }
}