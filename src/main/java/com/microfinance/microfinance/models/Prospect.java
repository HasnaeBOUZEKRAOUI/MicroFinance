package com.microfinance.microfinance.models;

import jakarta.persistence.Entity;

@Entity
public class Prospect extends Personne {
    private String statutProspect; // Ex: NOUVEAU, CONTACTE
    private String sourceProspect; // Ex: Pub, Recommandation
    private Double montantPretEstime;

    // Méthode métier pour transformer un prospect en client
    public void convertirEnClient() {
        // Logique de conversion
    }
}
