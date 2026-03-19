package com.portfolio.backend.repository;

import com.portfolio.backend.model.MasterAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MasterAdminRepository extends JpaRepository<MasterAdmin, Long> {
    Optional<MasterAdmin> findByUsername(String username);
    boolean existsByUsername(String username);
}