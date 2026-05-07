package com.microfinance.microfinance.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Entity
public class Client extends Personne {
    private String typePieceIdentite;
    private String numeroPieceIdentite;
    private LocalDate dateExpirationPiece;
    private String nationalite;
    private Double revenuMensuel;
    private Double scoreEligibilite;
    private boolean estSurListeNoire;

    @OneToMany(mappedBy = "client")
    private List<DemandeCredit> demandes;

    @OneToOne(mappedBy = "client", cascade = CascadeType.ALL)
    private Compte compte;
}