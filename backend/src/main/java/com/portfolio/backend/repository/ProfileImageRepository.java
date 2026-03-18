package com.portfolio.backend.repository;

import com.portfolio.backend.model.ProfileImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileImageRepository extends JpaRepository<ProfileImage, Long> {
    List<ProfileImage> findByImageTypeOrderByUploadedAtDesc(String imageType);
    Optional<ProfileImage> findByImageTypeAndPrimaryTrue(String imageType);
    List<ProfileImage> findAllByOrderByUploadedAtDesc();
}