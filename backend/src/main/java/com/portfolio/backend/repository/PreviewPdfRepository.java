package com.portfolio.backend.repository;

// FILE LOCATION: backend/src/main/java/com/portfolio/backend/repository/PreviewPdfRepository.java

import com.portfolio.backend.model.PreviewPdf;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PreviewPdfRepository extends JpaRepository<PreviewPdf, Long> {

    /**
     * Find the single PDF row for a given tier ('premium1' or 'premium2').
     */
    Optional<PreviewPdf> findByTier(String tier);

    /**
     * Delete the row for a given tier (used before replacing with a new upload).
     */
    void deleteByTier(String tier);
}