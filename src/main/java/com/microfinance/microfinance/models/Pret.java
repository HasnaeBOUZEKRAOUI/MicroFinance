package com.microfinance.microfinance.models;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
public class Pret {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Double montantAccorde;
    private LocalDate dateDebut;
    private String statutPret; // Tu peux utiliser un Enum ici

    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    @OneToMany(mappedBy = "pret", cascade = CascadeType.ALL)
    private List<Echeance> echeances;
}