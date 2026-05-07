package com.microfinance.microfinance.models;

import jakarta.persistence.*;

@Entity
public class Compte {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String numeroCompte;
    private String codeBanque;
    private Double soldeActuel;
    private String typeCompte;

    @OneToOne
    @JoinColumn(name = "client_id")
    private Client client;

    public void crediter(Double montant) {
        this.soldeActuel += montant;
    }

    public void debiter(Double montant) {
        this.soldeActuel -= montant;
    }
}