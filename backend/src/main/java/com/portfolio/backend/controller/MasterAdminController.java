package com.portfolio.backend.controller;

// FILE LOCATION: backend/src/main/java/com/portfolio/backend/controller/MasterAdminController.java

import com.portfolio.backend.dto.MasterAdminLoginRequest;
import com.portfolio.backend.model.PreviewPdf;
import com.portfolio.backend.model.ResumeFile;
import com.portfolio.backend.model.User;
import com.portfolio.backend.repository.*;
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

    @Autowired private MasterAdminService masterAdminService;
    @Autowired private UserRepository userRepository;
    @Autowired private PreviewPdfRepository previewPdfRepository;
    @Autowired private ResumeFileRepository resumeFileRepository;

    // ── Repositories for cascade-delete ──
    @Autowired private AchievementRepository achievementRepository;
    @Autowired private EducationRepository educationRepository;
    @Autowired private ExperienceRepository experienceRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private PortfolioProfileRepository portfolioProfileRepository;
    @Autowired private PortfolioSkillsRepository portfolioSkillsRepository;
    @Autowired private SocialLinksRepository socialLinksRepository;
    @Autowired private LanguageExperienceRepository languageExperienceRepository;
    @Autowired private PaymentRequestRepository paymentRequestRepository;

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
                dto.put("email",       u.getEmail());
                dto.put("role",        u.getRole());
                dto.put("enabled",     u.isEnabled());
                dto.put("hasPremium1", u.isHasPremium1());
                dto.put("hasPremium2", u.isHasPremium2());
                dto.put("createdAt",   u.getCreatedAt());
                dto.put("lastLogin",   u.getLastLogin());
                return dto;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch users: " + e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/master-admin/users/{username}
    // Deletes user + ALL their data in dependency order.
    // ─────────────────────────────────────────────────────────────────────────
    @DeleteMapping("/users/{username}")
    @Transactional
    public ResponseEntity<?> deleteUser(
            @PathVariable String username,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing token"));
        }

        // Normalize for lookup only — actual stored username may differ in casing
        String u = username == null ? "" : username.trim().toLowerCase();

        // ── Case-insensitive lookup so "Dheena", "dheena", "DHEENA" all resolve ──
        User existingUser = userRepository.findByUsernameIgnoreCase(u).orElse(null);

        if (existingUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found: " + u));
        }

        // Use the ACTUAL stored username for all child-table deletes
        String storedUsername = existingUser.getUsername();

        try {
            // Delete child data first (FK-safe order)
            achievementRepository.deleteByOwnerUsername(storedUsername);
            educationRepository.deleteByOwnerUsername(storedUsername);
            experienceRepository.deleteByOwnerUsername(storedUsername);
            projectRepository.deleteByOwnerUsername(storedUsername);
            resumeFileRepository.deleteByOwnerUsername(storedUsername);
            portfolioSkillsRepository.deleteByOwnerUsername(storedUsername);
            portfolioProfileRepository.deleteByOwnerUsername(storedUsername);
            socialLinksRepository.deleteByOwnerUsername(storedUsername);
            languageExperienceRepository.deleteByOwnerUsername(storedUsername);
            paymentRequestRepository.deleteByUsername(storedUsername);

            // Delete user by ID — reliable, no case sensitivity issues
            userRepository.deleteById(existingUser.getId());

            return ResponseEntity.ok(Map.of(
                    "message", "User @" + storedUsername + " and all data deleted successfully."
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Delete failed: " + e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/master-admin/users/{username}/resumes
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/users/{username}/resumes")
    public ResponseEntity<?> getUserResumes(
            @PathVariable String username,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing token"));
        }

        try {
            String normalizedUsername = username == null ? "" : username.trim().toLowerCase();
            List<ResumeFile> resumes = resumeFileRepository
                    .findAllByOwnerUsernameOrderByUploadedAtDesc(normalizedUsername);

            List<Map<String, Object>> result = resumes.stream().map(r -> {
                Map<String, Object> dto = new LinkedHashMap<>();
                dto.put("id",         r.getId());
                dto.put("fileName",   r.getFilename());
                dto.put("uploadedAt", r.getUploadedAt() != null ? r.getUploadedAt().toString() : null);
                dto.put("primary",    r.isPrimaryResume());
                return dto;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/master-admin/preview-pdfs
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
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/preview-pdfs/latest/{tier}")
    public ResponseEntity<?> getLatestPreviewPdf(@PathVariable String tier) {
        return previewPdfRepository.findByTier(tier)
                .map(pdf -> ResponseEntity.ok((Object) buildMeta(pdf)))
                .orElse(ResponseEntity.notFound().<Object>build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/master-admin/preview-pdfs/{id}
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