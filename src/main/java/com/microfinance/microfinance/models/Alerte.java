package com.microfinance.microfinance.models;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class Alerte {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String message;
    private String niveauGravite; // Ex: INFO, WARNING, CRITICAL
    private LocalDateTime dateAlerte;

    @ManyToOne
    private Pret pret;
}