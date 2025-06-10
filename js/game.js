
import {Card} from "./card.js"  
import { Pile } from "./piles.js"
import { dragState } from "./globals.js"

export {pasjans}

const draw_pile_sond = new Audio('sfx/draw_pile.wav')
const undo_sound = new Audio('sfx/undo.wav')
const new_game_sound = new Audio('sfx/new_game.wav')
const themes_sound = new Audio ('sfx/themes.wav')


export class CardGame{
    card_deck = []
    game_piles = []
    as_piles = []
    memory = []
    card_queque_number = 0  
    spare_deck = null
    back_color = 'pink'
    constructor(name){
        this.name = name
    }
    CreateDeck(){
        let template_types = ["spades","diamonds","clubs","hearths"]
        for(let i=0;i<template_types.length;i++){
            for(let j=1;j<14;j++){
                let card = new Card(j,template_types[i])
                card.ColorTranslate()
                this.card_deck.push(card)
            }
        }
    }
    ShuffleDeck(){
        for (let i = this.card_deck.length - 1; i > 0; i--) { 
            const j = Math.floor(Math.random() * (i + 1));
            [this.card_deck[i], this.card_deck[j]] = [this.card_deck[j], this.card_deck[i]]
          } 
    }
    MakePiles(){
        // Osiem stosów kart grywalnych
        for(let i=1;i<8;i++){
            let createPile = new Pile(i)
            createPile.type = 'game_pile'
            for(let j=0;j<i;j++){
                this.card_deck[j].current_pile = i
                this.card_deck[j].visible = false
                createPile.pile.push(this.card_deck[j])
                this.card_deck.splice(j,1)
            }
            createPile.pile[createPile.pile.length-1].visible = true
            this.game_piles.push(createPile)
            createPile.DrawPile()
        }
        this.card_deck.forEach(card => {
            card.current_pile = 'draw_pile'
        })
    }
    MakeDrawPiles(){
        this.card_deck.unshift(null)
        let draw_field = document.getElementById('draw_field')
        draw_field.style.backgroundImage = `url(img/backs/${pasjans.back_color}.png)`
        let discard_field = document.getElementById('discard_field')
        discard_field.innerHTML = ''
        this.card_queque_number = 0 
        draw_field.onclick = () => {
            draw_pile_sond.play()
            this.saveStatus(true)
            this.card_queque_number++
            if(this.card_queque_number > this.card_deck.length-1){
                this.card_queque_number = 0
            } 
            discard_field.innerHTML = ''
            if (this.card_deck[this.card_queque_number] && this.card_queque_number != 0) {
                const cardElem = this.card_deck[this.card_queque_number].DrawCard(0,'draw_pile')
                discard_field.appendChild(cardElem)
            }
            if(this.card_queque_number == this.card_deck.length-1){
                draw_field.style.backgroundImage = `url()`
            }
            else{
                draw_field.style.backgroundImage = `url(img/backs/${pasjans.back_color}.png)`
            }
               
        }
    }
    MakeAsPiles(){
        this.as_piles = []
        let template_types = ["spades","diamonds","clubs","hearths"]

        template_types.forEach(suit => {
            let pile = new Pile(suit)
            pile.name = suit
            pile.type = 'as_pile'
            this.as_piles.push(pile)
            pile.DrawPile()
        })

    }
    RedrawPiles(){
        this.game_piles.forEach(element => {
            element.DrawPile()
        })
        this.as_piles.forEach(element => {
            element.DrawPile()
        })
        if(this.as_piles.every(pile => pile.pile.length === 13) == true){
            document.getElementById('winning').style.display = 'flex'
            console.log('GAME WON !!!!')
        }
    }
    GetPileByName(name) {
        if(name == "spades" || name == "diamonds" || name == "clubs" || name == "hearths"){
            return this.as_piles.find(p => p.name === name)
        }
        return this.game_piles.find(p => p.name === name)
    }
    undoMove(){
        undo_sound.play()
        if(this.memory.length > 0){
            const desired_state = this.memory.pop()

            this.card_deck = desired_state.deck.map(c => c instanceof Card ? c.Clone() : null);
            this.card_queque_number = desired_state.deck_index

            this.game_piles = desired_state.g_piles.map(p => p.Clone())
            this.as_piles = desired_state.as_piles.map(p => p.Clone())


            this.RedrawPiles()
            const discard_field = document.getElementById('discard_field')
            discard_field.innerHTML = ''
            if (this.card_queque_number > 0 && this.card_queque_number < this.card_deck.length) {
                const card = this.card_deck[this.card_queque_number]
                if (card instanceof Card) {
                    const cardElem = card.DrawCard(0, 'draw_pile')
                    discard_field.appendChild(cardElem)
                }
            } else {
                discard_field.innerHTML = ''
            }
        }
    }
    saveStatus(deck){
        if(this.memory.length == 5){
            this.memory.shift()
        }
        let status = {
            g_piles: null,
            as_piles: null,
            deck: null,
            deck_index: null
        };
        if(deck == true){
            status = {
                g_piles: this.game_piles.map(pile => pile.Clone()),
                as_piles: this.as_piles.map(pile => pile.Clone()),
                deck: this.card_deck.map(card => {
                    if (card instanceof Card) {
                        return card.Clone()
                    }
                    return card
                }),
                deck_index: this.card_queque_number
            };
            this.spare_deck = this.card_deck.map(card => {
                    if (card instanceof Card) {
                        return card.Clone()
                    }
                    return card
                })
        }
        else{
            status = {
            g_piles: this.game_piles.map(pile => pile.Clone()),
            as_piles: this.as_piles.map(pile => pile.Clone()),
            deck_index: this.card_queque_number,
            deck : this.spare_deck.map(card => {
                if (card instanceof Card) {
                    return card.Clone()
                }
                return card
            })
        }
        }
        // console.log(status)
        this.memory.push(status)
    }

}

// PRZYCISKI

document.getElementById('new_game').addEventListener('click', () => {
    new_game_sound.play()
    pasjans = new CardGame('pasjans')
    pasjans.back_color = card_back_color
    pasjans.CreateDeck()
    pasjans.ShuffleDeck()
    pasjans.MakeAsPiles()
    pasjans.MakePiles()
    pasjans.MakeDrawPiles()
    pasjans.saveStatus(true)
})
document.getElementById('new_game_2').addEventListener('click', () => {
    new_game_sound.play()
    document.getElementById('winning').style.display = 'none'
    pasjans = new CardGame('pasjans')
    pasjans.back_color = card_back_color
    pasjans.CreateDeck()
    pasjans.ShuffleDeck()
    pasjans.MakeAsPiles()
    pasjans.MakePiles()
    pasjans.MakeDrawPiles()
    pasjans.saveStatus(true)
})

document.getElementById('themes').addEventListener('click', () => {
    document.getElementById('card_back').showModal()
    themes_sound.play()
})

let card_back_color = 'pink' 

function changeBack(color){
    pasjans.back_color = color
    card_back_color = color
    document.getElementById('card_back').close()
    if(pasjans.card_queque_number != pasjans.card_deck.length-1){
        draw_field.style.backgroundImage = `url(img/backs/${pasjans.back_color}.png)`
    }
    pasjans.RedrawPiles()
}

function changeBackground(color){
    document.body.style.backgroundImage = `url(img/backgrounds/${color}.png)`
    document.getElementById('card_back').close()
}

window.changeBackground = changeBackground
window.changeBack = changeBack



let pasjans = new CardGame('pasjans')
document.getElementById('undo').addEventListener('click',() => pasjans.undoMove())
pasjans.CreateDeck()
pasjans.ShuffleDeck()
pasjans.MakeAsPiles()
pasjans.MakePiles()
pasjans.MakeDrawPiles()
pasjans.saveStatus(true)