package com.microfinance.microfinance.models;

import com.microfinance.microfinance.models.enums.RoleEmploye;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;

import java.time.LocalDate;
import java.util.List;

@Entity
public class Employe extends Personne {
    private String nomUtilisateur;
    private String motDePasse;
    @Enumerated(EnumType.STRING) // Très important pour garder le texte en base de données
    private RoleEmploye role;
    private LocalDate dateEmbauche;

    @OneToMany(mappedBy = "gestionnaire")
    private List<DemandeCredit> demandesGerees;
}