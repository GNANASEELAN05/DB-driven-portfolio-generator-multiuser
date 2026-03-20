package com.portfolio.backend.repository;

import com.portfolio.backend.model.ResumeFile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ResumeFileRepository extends JpaRepository<ResumeFile, Long> {

    long countByOwnerUsername(String ownerUsername);

    List<ResumeFile> findAllByOwnerUsernameOrderByUploadedAtDesc(String ownerUsername);

    Optional<ResumeFile> findFirstByOwnerUsernameAndPrimaryResumeTrue(String ownerUsername);

    void deleteByOwnerUsername(String ownerUsername);
}