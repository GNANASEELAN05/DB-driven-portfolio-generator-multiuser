package com.portfolio.backend.controller;

import com.portfolio.backend.model.*;
import com.portfolio.backend.repository.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/u/{username}/portfolio")
public class PortfolioController {

    private final PortfolioProfileRepository profileRepo;
    private final PortfolioSkillsRepository skillsRepo;
    private final ExperienceRepository expRepo;
    private final EducationRepository eduRepo;
    private final SocialLinksRepository socialsRepo;
    private final AchievementRepository achievementRepo;
    private final LanguageExperienceRepository languageRepo;

    public PortfolioController(
            PortfolioProfileRepository profileRepo,
            PortfolioSkillsRepository skillsRepo,
            ExperienceRepository expRepo,
            EducationRepository eduRepo,
            SocialLinksRepository socialsRepo,
            AchievementRepository achievementRepo,
            LanguageExperienceRepository languageRepo
    ) {
        this.profileRepo = profileRepo;
        this.skillsRepo = skillsRepo;
        this.expRepo = expRepo;
        this.eduRepo = eduRepo;
        this.socialsRepo = socialsRepo;
        this.achievementRepo = achievementRepo;
        this.languageRepo = languageRepo;
    }

    // ====================== helpers ======================

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

    // ====================== PUBLIC GETs ======================

    @GetMapping("/profile")
    public PortfolioProfile getProfile(@PathVariable String username) {
        return profileRepo.findFirstByOwnerUsername(norm(username)).orElse(null);
    }

    @GetMapping("/skills")
    public PortfolioSkills getSkills(@PathVariable String username) {
        return skillsRepo.findFirstByOwnerUsername(norm(username)).orElse(null);
    }

    @GetMapping("/socials")
    public SocialLinks getSocials(@PathVariable String username) {
        return socialsRepo.findFirstByOwnerUsername(norm(username)).orElse(null);
    }

    @GetMapping("/achievements")
    public List<AchievementItem> getAchievements(@PathVariable String username) {
        return achievementRepo.findAllByOwnerUsernameOrderByIdAsc(norm(username));
    }

    @GetMapping("/languages")
    public List<LanguageExperienceItem> getLanguages(@PathVariable String username) {
        return languageRepo.findAllByOwnerUsernameOrderByIdAsc(norm(username));
    }

    @GetMapping("/education")
    public List<EducationItem> getEducation(@PathVariable String username) {
        return eduRepo.findAllByOwnerUsernameOrderByIdAsc(norm(username));
    }

    @GetMapping("/experience")
    public List<ExperienceItem> getExperience(@PathVariable String username) {
        return expRepo.findAllByOwnerUsernameOrderByIdAsc(norm(username));
    }

    // ====================== ADMIN PUTs (must match JWT user) ======================

    @PutMapping("/profile")
    @Transactional
    public PortfolioProfile updateProfile(@PathVariable String username,
                                         @RequestBody PortfolioProfile body) {
        assertOwner(username);
        String u = norm(username);
        profileRepo.deleteByOwnerUsername(u);
        body.setId(null);
        body.setOwnerUsername(u);
        return profileRepo.save(body);
    }

    @PutMapping("/skills")
    @Transactional
    public PortfolioSkills updateSkills(@PathVariable String username,
                                        @RequestBody PortfolioSkills body) {
        assertOwner(username);
        String u = norm(username);
        skillsRepo.deleteByOwnerUsername(u);
        body.setId(null);
        body.setOwnerUsername(u);
        return skillsRepo.save(body);
    }

    @PutMapping("/socials")
    @Transactional
    public SocialLinks updateSocials(@PathVariable String username,
                                     @RequestBody SocialLinks body) {
        assertOwner(username);
        String u = norm(username);
        socialsRepo.deleteByOwnerUsername(u);
        body.setId(null);
        body.setOwnerUsername(u);
        return socialsRepo.save(body);
    }

    @PutMapping("/achievements")
    @Transactional
    public List<AchievementItem> saveAchievements(@PathVariable String username,
                                                  @RequestBody List<AchievementItem> items) {
        assertOwner(username);
        String u = norm(username);

        // ── Preserve certificate data for items that already exist ──────────
        // When admin bulk-saves achievements, certificate blobs must NOT be lost.
        // We keep a map of id → existing cert data before wiping the table.
        Map<Long, AchievementItem> existing = new HashMap<>();
        achievementRepo.findAllByOwnerUsernameOrderByIdAsc(u)
                .forEach(a -> existing.put(a.getId(), a));

        achievementRepo.deleteByOwnerUsername(u);

        for (AchievementItem a : items) {
            a.setOwnerUsername(u);
            // id is stripped on the client side — but if somehow an id arrives
            // and we have cert data for it, carry the cert over.
            if (a.getId() != null && existing.containsKey(a.getId())) {
                AchievementItem old = existing.get(a.getId());
                if (a.getCertificateData() == null && old.getCertificateData() != null) {
                    a.setCertificateData(old.getCertificateData());
                    a.setCertificateFileName(old.getCertificateFileName());
                    a.setCertificateContentType(old.getCertificateContentType());
                }
            }
            a.setId(null); // always let DB generate a new id after delete-all
        }
        return achievementRepo.saveAll(items);
    }

    @PutMapping("/languages")
    @Transactional
    public List<LanguageExperienceItem> saveLanguages(@PathVariable String username,
                                                      @RequestBody List<LanguageExperienceItem> items) {
        assertOwner(username);
        String u = norm(username);
        languageRepo.deleteByOwnerUsername(u);
        for (LanguageExperienceItem l : items) {
            l.setId(null);
            l.setOwnerUsername(u);
        }
        return languageRepo.saveAll(items);
    }

    @PutMapping("/education")
    @Transactional
    public List<EducationItem> saveEducation(@PathVariable String username,
                                             @RequestBody List<EducationItem> items) {
        assertOwner(username);
        String u = norm(username);
        eduRepo.deleteByOwnerUsername(u);
        for (EducationItem e : items) {
            e.setId(null);
            e.setOwnerUsername(u);
        }
        return eduRepo.saveAll(items);
    }

    @PutMapping("/experience")
    @Transactional
    public List<ExperienceItem> saveExperience(@PathVariable String username,
                                               @RequestBody List<ExperienceItem> items) {
        assertOwner(username);
        String u = norm(username);
        expRepo.deleteByOwnerUsername(u);
        for (ExperienceItem e : items) {
            e.setId(null);
            e.setOwnerUsername(u);
        }
        return expRepo.saveAll(items);
    }

    // ====================== CERTIFICATE endpoints ======================

    /**
     * POST /api/u/{username}/portfolio/achievements/{id}/certificate
     * Upload a certificate (PDF or image) for an achievement.
     * Requires ADMIN JWT matching the username.
     */
    @PostMapping("/achievements/{id}/certificate")
    public ResponseEntity<?> uploadCertificate(
            @PathVariable String username,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        assertOwner(username);

        Optional<AchievementItem> opt = achievementRepo.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        AchievementItem ach = opt.get();
        if (!ach.getOwnerUsername().equals(norm(username))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Validate MIME type
        String mime = file.getContentType();
        if (mime == null ||
            (!mime.equals("application/pdf")
             && !mime.startsWith("image/jpeg")
             && !mime.startsWith("image/jpg")
             && !mime.startsWith("image/png"))) {
            return ResponseEntity.badRequest()
                    .body("Only PDF, JPEG, and PNG files are allowed.");
        }

        try {
            ach.setCertificateFileName(file.getOriginalFilename());
            ach.setCertificateContentType(mime);
            ach.setCertificateData(file.getBytes());
            achievementRepo.save(ach);

            return ResponseEntity.ok(Map.of(
                "success",  true,
                "fileName", file.getOriginalFilename() != null ? file.getOriginalFilename() : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Upload failed: " + e.getMessage());
        }
    }

    /**
     * GET /api/u/{username}/portfolio/achievements/{id}/certificate
     * Publicly accessible — viewers can preview certificates.
     */
    @GetMapping("/achievements/{id}/certificate")
    public ResponseEntity<byte[]> viewCertificate(
            @PathVariable String username,
            @PathVariable Long id) {

        Optional<AchievementItem> opt = achievementRepo.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        AchievementItem ach = opt.get();
        if (ach.getCertificateData() == null || ach.getCertificateData().length == 0) {
            return ResponseEntity.notFound().build();
        }

        String contentType = ach.getCertificateContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "application/pdf";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setCacheControl("no-cache, no-store, must-revalidate");
        headers.set("Content-Disposition", "inline; filename=\"" +
                (ach.getCertificateFileName() != null ? ach.getCertificateFileName() : "certificate") + "\"");

        return new ResponseEntity<>(ach.getCertificateData(), headers, HttpStatus.OK);
    }

    /**
     * DELETE /api/u/{username}/portfolio/achievements/{id}/certificate
     * Remove a certificate from an achievement.
     * Requires ADMIN JWT matching the username.
     */
    @DeleteMapping("/achievements/{id}/certificate")
    public ResponseEntity<?> deleteCertificate(
            @PathVariable String username,
            @PathVariable Long id) {

        assertOwner(username);

        Optional<AchievementItem> opt = achievementRepo.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        AchievementItem ach = opt.get();
        if (!ach.getOwnerUsername().equals(norm(username))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        ach.setCertificateFileName(null);
        ach.setCertificateContentType(null);
        ach.setCertificateData(null);
        achievementRepo.save(ach);

        return ResponseEntity.ok(Map.of("success", true));
    }
}