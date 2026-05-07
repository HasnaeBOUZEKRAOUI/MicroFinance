package com.microfinance.microfinance.models;

import com.microfinance.microfinance.models.enums.StatutDossier;
import jakarta.persistence.*;

@Entity
public class DemandeCredit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Double montantDemande;
    private int dureeDemandee;
    private String objetPret;
    @Enumerated(EnumType.STRING) // Enregistre le texte (ex: "APPROUVE") en base de données
    private StatutDossier statutDemande;
    @ManyToOne
    private Client client;

    @ManyToOne
    private Employe gestionnaire;

    @OneToOne(mappedBy = "demande")
    private Pret pretGenere;
}