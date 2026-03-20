package com.portfolio.backend.repository;

import com.portfolio.backend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findAllByOwnerUsernameOrderByUpdatedAtDesc(String ownerUsername);

    List<Project> findByOwnerUsernameAndFeaturedTrueOrderByUpdatedAtDesc(String ownerUsername);

    void deleteByOwnerUsername(String ownerUsername);
}