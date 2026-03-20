package com.portfolio.backend.controller;

// FILE LOCATION: backend/src/main/java/com/portfolio/backend/controller/MasterAdminController.java

import com.portfolio.backend.dto.MasterAdminLoginRequest;
import com.portfolio.backend.model.PreviewPdf;
import com.portfolio.backend.model.User;
import com.portfolio.backend.repository.PreviewPdfRepository;
import com.portfolio.backend.repository.UserRepository;
import com.portfolio.backend.service.MasterAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/master-admin")
public class MasterAdminController {

    @Autowired
    private MasterAdminService masterAdminService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PreviewPdfRepository previewPdfRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/master-admin/login
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody MasterAdminLoginRequest request) {
        try {
            Map<String, String> response = masterAdminService.login(
                    request.getUsername(),
                    request.getPassword()
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid controller credentials"));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/master-admin/verify
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/verify")
    public ResponseEntity<?> verify(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing token"));
        }
        return ResponseEntity.ok(Map.of("valid", true, "role", "CONTROLLER"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/master-admin/users
    // Returns all registered users — safe fields only, no passwords.
    // Premium tiers read from DB (hasPremium1 / hasPremium2 columns).
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing or invalid token"));
        }

        try {
            List<User> users = userRepository.findAll();

            List<Map<String, Object>> result = users.stream().map(u -> {
                Map<String, Object> dto = new LinkedHashMap<>();
                dto.put("id",          u.getId());
                dto.put("username",    u.getUsername());
                dto.put("email",       u.getEmail());       // nullable — added in updated User.java
                dto.put("role",        u.getRole());
                dto.put("enabled",     u.isEnabled());      // added in updated User.java
                dto.put("hasPremium1", u.isHasPremium1());
                dto.put("hasPremium2", u.isHasPremium2());
                dto.put("createdAt",   u.getCreatedAt());   // added in updated User.java
                dto.put("lastLogin",   u.getLastLogin());   // added in updated User.java
                return dto;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch users: " + e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/master-admin/preview-pdfs
    // Returns metadata (NO binary bytes) for both tier PDFs.
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/preview-pdfs")
    public ResponseEntity<?> getPreviewPdfs(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing token"));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("premium1", buildPdfMetaList("premium1"));
        result.put("premium2", buildPdfMetaList("premium2"));
        return ResponseEntity.ok(result);
    }

    private List<Map<String, Object>> buildPdfMetaList(String tier) {
        return previewPdfRepository.findByTier(tier)
                .map(pdf -> List.of(buildMeta(pdf)))
                .orElse(List.of());
    }

    private Map<String, Object> buildMeta(PreviewPdf pdf) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",         pdf.getId());
        m.put("tier",       pdf.getTier());
        m.put("fileName",   pdf.getFileName());
        m.put("uploadedAt", pdf.getUploadedAt() != null ? pdf.getUploadedAt().toString() : null);
        m.put("active",     true);
        return m;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/master-admin/preview-pdfs/upload
    // Upserts the preview PDF for a tier (replaces existing row if present).
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/preview-pdfs/upload")
    @Transactional
    public ResponseEntity<?> uploadPreviewPdf(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("file") MultipartFile file,
            @RequestParam("tier") String tier) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing token"));
        }
        if (!tier.equals("premium1") && !tier.equals("premium2")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid tier. Use 'premium1' or 'premium2'"));
        }
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }
        String ct = file.getContentType();
        if (ct == null || !ct.equals("application/pdf")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only PDF files are allowed"));
        }

        try {
            // Upsert: reuse existing row for tier if present, else create new
            PreviewPdf pdf = previewPdfRepository.findByTier(tier).orElse(new PreviewPdf());
            pdf.setTier(tier);
            pdf.setFileName(file.getOriginalFilename() != null
                    ? file.getOriginalFilename() : "preview.pdf");
            pdf.setData(file.getBytes());
            pdf.setUploadedAt(LocalDateTime.now());

            PreviewPdf saved = previewPdfRepository.save(pdf);

            return ResponseEntity.ok(Map.of(
                    "message",  "PDF uploaded successfully",
                    "id",       saved.getId(),
                    "tier",     tier,
                    "fileName", saved.getFileName()
            ));

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/master-admin/preview-pdfs/{id}/view
    // Streams PDF bytes inline. PUBLIC — no token (used in <iframe>).
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/preview-pdfs/{id}/view")
    public ResponseEntity<byte[]> viewPreviewPdfById(@PathVariable Long id) {
        return previewPdfRepository.findById(id)
                .filter(pdf -> pdf.getData() != null)
                .map(pdf -> ResponseEntity.ok()
                        .header("Content-Type", "application/pdf")
                        .header("Content-Disposition",
                                "inline; filename=\"" + pdf.getFileName() + "\"")
                        .body(pdf.getData()))
                .orElse(ResponseEntity.notFound().<byte[]>build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/master-admin/preview-pdfs/latest/{tier}
    // Returns metadata for the active PDF of a tier.
    // PUBLIC — used by VersionPickerModal (no token needed).
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/preview-pdfs/latest/{tier}")
    public ResponseEntity<?> getLatestPreviewPdf(@PathVariable String tier) {
        return previewPdfRepository.findByTier(tier)
                .map(pdf -> ResponseEntity.ok((Object) buildMeta(pdf)))
                .orElse(ResponseEntity.notFound().<Object>build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/master-admin/preview-pdfs/{id}
    // Deletes by numeric DB ID (used by dashboard delete button).
    // ─────────────────────────────────────────────────────────────────────────
    @DeleteMapping("/preview-pdfs/{id}")
    @Transactional
    public ResponseEntity<?> deletePreviewPdfById(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing token"));
        }
        if (!previewPdfRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        previewPdfRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}