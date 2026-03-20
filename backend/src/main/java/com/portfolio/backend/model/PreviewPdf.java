package com.portfolio.backend.model;

// FILE LOCATION: backend/src/main/java/com/portfolio/backend/model/PreviewPdf.java

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Stores the two portfolio preview PDFs (Premium1 and Premium2) as BYTEA in the DB.
 * Only ONE row per tier is kept — uploading a new PDF for a tier replaces the old one.
 *
 * Table: preview_pdf
 *   id          BIGSERIAL PRIMARY KEY
 *   tier        VARCHAR(20)   — 'premium1' or 'premium2'
 *   file_name   VARCHAR(255)
 *   data        BYTEA         — PDF bytes
 *   uploaded_at TIMESTAMP
 */
@Entity
@Table(name = "preview_pdf")
public class PreviewPdf {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 'premium1' or 'premium2'
     * Unique so there is exactly one row per tier.
     */
    @Column(nullable = false, unique = true, length = 20)
    private String tier;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /**
     * Actual PDF bytes stored as BYTEA (PostgreSQL).
     * Do NOT use @Lob — it maps to OID on PostgreSQL which causes issues.
     */
    @Column(columnDefinition = "bytea")
    private byte[] data;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        uploadedAt = LocalDateTime.now();
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public byte[] getData() { return data; }
    public void setData(byte[] data) { this.data = data; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}