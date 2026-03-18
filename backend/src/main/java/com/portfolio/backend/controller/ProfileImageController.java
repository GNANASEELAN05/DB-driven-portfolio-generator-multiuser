package com.portfolio.backend.controller;

import com.portfolio.backend.model.ProfileImage;
import com.portfolio.backend.repository.ProfileImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/profile-image")
@CrossOrigin(origins = "*")
public class ProfileImageController {

    @Autowired
    private ProfileImageRepository profileImageRepository;

    // ── UPLOAD ────────────────────────────────────────────────────────────
    @PostMapping("/upload/{type}")
    public ResponseEntity<?> uploadImage(
            @PathVariable String type,
            @RequestParam("file") MultipartFile file) {

        if (!type.equals("original") && !type.equals("animated")) {
            return ResponseEntity.badRequest().body("type must be 'original' or 'animated'");
        }
        try {
            ProfileImage img = new ProfileImage();
            img.setImageType(type);
            img.setFilename(file.getOriginalFilename());
            img.setContentType(file.getContentType());
            img.setData(file.getBytes());
            img.setUploadedAt(LocalDateTime.now());
            img.setPrimary(false);
            profileImageRepository.save(img);

            return ResponseEntity.ok(Map.of(
                "id",         img.getId(),
                "imageType",  img.getImageType(),
                "filename",   img.getFilename(),
                "primary",    img.isPrimary(),
                "uploadedAt", img.getUploadedAt().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Upload failed: " + e.getMessage());
        }
    }

    // ── LIST ALL ──────────────────────────────────────────────────────────
    @GetMapping("/list")
    public ResponseEntity<?> listAll() {
        List<ProfileImage> all = profileImageRepository.findAllByOrderByUploadedAtDesc();
        List<Map<String, Object>> result = all.stream().map(img -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",         img.getId());
            m.put("imageType",  img.getImageType());
            m.put("filename",   img.getFilename());
            m.put("primary",    img.isPrimary());
            m.put("uploadedAt", img.getUploadedAt() != null ? img.getUploadedAt().toString() : null);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── VIEW PRIMARY by type (portfolio viewer) ────────────────────────────
    @GetMapping("/{type}")
    public ResponseEntity<byte[]> viewPrimary(@PathVariable String type) {
        if (!type.equals("original") && !type.equals("animated")) {
            return ResponseEntity.badRequest().build();
        }
        Optional<ProfileImage> opt = profileImageRepository.findByImageTypeAndPrimaryTrue(type);
        if (opt.isEmpty()) {
            List<ProfileImage> all = profileImageRepository.findByImageTypeOrderByUploadedAtDesc(type);
            if (!all.isEmpty()) opt = Optional.of(all.get(0));
        }
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        ProfileImage img = opt.get();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
            img.getContentType() != null ? img.getContentType() : "image/png"
        ));
        headers.setCacheControl("no-cache, no-store, must-revalidate");
        return new ResponseEntity<>(img.getData(), headers, HttpStatus.OK);
    }

    // ── VIEW by ID (admin preview) ─────────────────────────────────────────
    @GetMapping("/view/{id}")
    public ResponseEntity<byte[]> viewById(@PathVariable Long id) {
        Optional<ProfileImage> opt = profileImageRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        ProfileImage img = opt.get();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
            img.getContentType() != null ? img.getContentType() : "image/png"
        ));
        headers.setCacheControl("no-cache, no-store, must-revalidate");
        return new ResponseEntity<>(img.getData(), headers, HttpStatus.OK);
    }

    // ── SET PRIMARY ────────────────────────────────────────────────────────
    @PutMapping("/set-primary/{id}")
    public ResponseEntity<?> setPrimary(@PathVariable Long id) {
        Optional<ProfileImage> opt = profileImageRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        ProfileImage target = opt.get();
        String type = target.getImageType();

        List<ProfileImage> sameType = profileImageRepository.findByImageTypeOrderByUploadedAtDesc(type);
        sameType.forEach(img -> img.setPrimary(false));
        profileImageRepository.saveAll(sameType);

        target.setPrimary(true);
        profileImageRepository.save(target);

        return ResponseEntity.ok(Map.of("success", true, "id", id, "type", type));
    }

    // ── DELETE by ID ───────────────────────────────────────────────────────
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteById(@PathVariable Long id) {
        Optional<ProfileImage> opt = profileImageRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        ProfileImage toDelete = opt.get();
        boolean wasPrimary = toDelete.isPrimary();
        String type = toDelete.getImageType();
        profileImageRepository.deleteById(id);

        if (wasPrimary) {
            List<ProfileImage> remaining = profileImageRepository.findByImageTypeOrderByUploadedAtDesc(type);
            if (!remaining.isEmpty()) {
                remaining.get(0).setPrimary(true);
                profileImageRepository.save(remaining.get(0));
            }
        }
        return ResponseEntity.ok(Map.of("success", true, "deleted", id));
    }
}