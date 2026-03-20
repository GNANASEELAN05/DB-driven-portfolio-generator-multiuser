package com.portfolio.backend.controller;

import com.portfolio.backend.model.ResumeFile;
import com.portfolio.backend.service.ResumeService;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/u/{username}/resume")
@CrossOrigin(origins = "*")
public class ResumeController {

    private final ResumeService service;

    public ResumeController(ResumeService service) {
        this.service = service;
    }

    private String norm(String username) {
        return username == null ? "" : username.trim().toLowerCase();
    }

    private void assertOwner(String username) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        String current = auth.getName().trim().toLowerCase();
        if (!current.equals(norm(username))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your portfolio");
        }
    }

    /**
     * Accepts:
     *  - portfolio owner (ROLE_ADMIN, username matches), OR
     *  - platform controller (ROLE_CONTROLLER — any username)
     */
    private boolean isOwnerOrController(String username) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;

        // Check ROLE_CONTROLLER — controller token bypasses username matching
        boolean isController = auth.getAuthorities() != null &&
                auth.getAuthorities().stream()
                        .anyMatch(a -> "ROLE_CONTROLLER".equals(a.getAuthority()));
        if (isController) return true;

        // Check portfolio owner
        if (auth.getName() == null) return false;
        return auth.getName().trim().toLowerCase().equals(norm(username));
    }

    // =========================================================
    // ADMIN: Upload PDF resume (owner only)
    // =========================================================
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@PathVariable String username,
                                    @RequestPart("file") MultipartFile file) {
        assertOwner(username);
        try {
            service.uploadResume(username, file);
            return ResponseEntity.ok("Resume uploaded successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }

    // =========================================================
    // ADMIN: Get all resumes (owner only)
    // =========================================================
    @GetMapping("/list")
    public ResponseEntity<?> getAll(@PathVariable String username) {
        assertOwner(username);
        return buildResumeList(username);
    }

    // =========================================================
    // CONTROLLER: Get all resumes for any user
    // Accepts ROLE_CONTROLLER token OR owner token
    // =========================================================
    @GetMapping("/list-admin")
    public ResponseEntity<?> getAllAdmin(@PathVariable String username) {
        if (!isOwnerOrController(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Not authorized — requires owner or controller token");
        }
        return buildResumeList(username);
    }

    // ── shared list builder ──────────────────────────────────
    private ResponseEntity<?> buildResumeList(String username) {
        try {
            List<ResumeFile> list = service.getAllResumes(username);
            List<Map<String, Object>> response = new ArrayList<>();
            int i = 1;
            for (ResumeFile r : list) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id",         r.getId());
                map.put("fileName",   r.getFilename());
                map.put("serial",     i++);
                map.put("primary",    r.isPrimaryResume());
                map.put("uploadedAt", r.getUploadedAt());
                response.add(map);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to fetch resumes");
        }
    }

    // =========================================================
    // ADMIN/CONTROLLER: Preview resume by id
    // =========================================================
    @GetMapping("/{id}/view")
    public ResponseEntity<byte[]> viewResume(@PathVariable String username,
                                             @PathVariable Long id) {
        if (!isOwnerOrController(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        try {
            ResumeFile file = service.getResumeById(username, id);
            if (file == null || file.getData() == null)
                return ResponseEntity.notFound().build();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(
                    ContentDisposition.inline()
                            .filename(file.getFilename() != null ? file.getFilename() : "resume.pdf")
                            .build()
            );
            return new ResponseEntity<>(file.getData(), headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    // =========================================================
    // PUBLIC: Download primary resume
    // =========================================================
    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadLatest(@PathVariable String username) {
        try {
            ResumeFile latest = service.getLatestResume(username);
            if (latest == null || latest.getData() == null)
                return ResponseEntity.notFound().build();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(
                    ContentDisposition.inline()
                            .filename(latest.getFilename() != null ? latest.getFilename() : "resume.pdf")
                            .build()
            );
            return new ResponseEntity<>(latest.getData(), headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    // =========================================================
    // ADMIN: Delete resume (owner only)
    // =========================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String username,
                                    @PathVariable Long id) {
        assertOwner(username);
        try {
            service.deleteResume(username, id);
            return ResponseEntity.ok("Deleted");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Delete failed");
        }
    }

    // =========================================================
    // ADMIN: Set primary resume (owner only)
    // =========================================================
    @PutMapping("/{id}/primary")
    public ResponseEntity<?> setPrimary(@PathVariable String username,
                                        @PathVariable Long id) {
        assertOwner(username);
        try {
            service.setPrimary(username, id);
            return ResponseEntity.ok("Primary updated");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Primary update failed");
        }
    }
}