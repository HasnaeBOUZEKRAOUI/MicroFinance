package com.microfinance.microfinance.models;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
public class Paiement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private LocalDate datePaiement;
    private Double montant;
    private String modePaiement; // Ex: ESPECE, VIREMENT
    private String referenceTransaction;

    @ManyToOne
    private Echeance echeanceReglee;
}