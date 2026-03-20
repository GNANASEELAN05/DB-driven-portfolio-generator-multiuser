package com.portfolio.backend.repository;

import com.portfolio.backend.model.PaymentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, Long> {
    List<PaymentRequest> findAllByOrderByCreatedAtDesc();
    List<PaymentRequest> findByUsernameOrderByCreatedAtDesc(String username);
    List<PaymentRequest> findByStatusOrderByCreatedAtDesc(String status);
    void deleteByUsername(String username);
}