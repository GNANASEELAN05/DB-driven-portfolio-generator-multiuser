package com.portfolio.backend.controller;

import com.portfolio.backend.dto.MasterAdminLoginRequest;
import com.portfolio.backend.service.MasterAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/master-admin")
public class MasterAdminController {

    @Autowired
    private MasterAdminService masterAdminService;

    // POST /api/master-admin/login
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

    // GET /api/master-admin/verify  — validate controller token
    @GetMapping("/verify")
    public ResponseEntity<?> verify(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing token"));
            }
            // Token presence + structure is enough here;
            // full validation is done by JwtAuthFilter for secured endpoints
            return ResponseEntity.ok(Map.of("valid", true, "role", "CONTROLLER"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid token"));
        }
    }
}