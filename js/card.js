
import { dragState } from "./globals.js"
import { pasjans } from "./game.js"


const take_card = new Audio('sfx/take_card.wav')
export class Card{
    number = 0;
    suit = "";
    visible = true
    color = "none"
    current_pile = ""
    constructor(number,suit){
        this.number = number
        this.suit = suit
        this.visible = true
    }  
    Clone() {
        const copy = new Card(this.number, this.suit)
        copy.visible = this.visible
        copy.current_pile = this.current_pile
        copy.ColorTranslate()
        return copy
    }
    NumberTranslate(){
        if(this.number == 11){
            return 'J'
        }
        if(this.number == 12){
            return 'Q'
        }
        if(this.number == 13){
            return 'K'
        }
        if(this.number == 1){
            return 'A'
        }
        else{
            return this.number
        }
    }
    ColorTranslate(){
        if(this.suit == "spades" || this.suit == "clubs"){
            this.color = 'black'
        }
        else{
            this.color = 'red'
        }
    }
    DrawCard(index,source_pile){

        if(source_pile == 'draw_pile'){
            dragState.drag_source_pile = 'draw_pile'
        }

        let card = document.createElement('div')
        card.id = `${this.number}_${this.suit}`
        card.draggable = true
        card.classList.add('card')

        if(this.visible == true){
            card.style.backgroundImage = `url(img/${this.suit}/${this.number}.png)`
        }
        else{
            card.style.backgroundImage = `url(img/backs/${pasjans.back_color}.png)`
            card.draggable = false
            card.innerHTML = ''
        }

        
        // On drop
        card.ondrop = (ev) => ev.preventDefault()

        // DRAG START
        card.ondragstart = (ev) => {

            take_card.play()
            if(source_pile && (source_pile.type === 'game_pile' || source_pile === 'draw_pile')){
                let movable;
                if (source_pile === 'draw_pile') {
                    // Z `draw_pile` można przeciągać tylko jedną kartę
                    movable = [this]
                    const indexInDeck = pasjans.card_deck.findIndex(card => 
                        card instanceof Card && card.number === this.number && card.suit === this.suit
                    )
                    if (indexInDeck !== -1) {
                        pasjans.card_deck.splice(indexInDeck, 1)
                    }
                } 
                else {
                    movable = source_pile.GetMovableStackFrom(index)
                }



                // console.log('podnoszę teraz ',movable)
                if (!movable) {
                    ev.preventDefault()
                    return
                }
                dragState.drag_ghost_pile = [...movable]
                dragState.drag_source_pile = source_pile

                // Karta znika
                if(source_pile == 'draw_pile'){
                    const cardId = `${this.number}_${this.suit}`
                    const cardElem = document.getElementById(cardId)
                    cardElem.style.opacity = 0
                }
                else{
                    dragState.drag_source_pile.HideCardsFrom(index)
                }



                // stworzenie przenoszonych kart widocznych dla użytkownika
                const ghost_cards = document.createElement('div')
                ghost_cards.id = 'ghost_cards'

                movable.forEach((g_card,index) => {
                    const card_div = document.createElement('div')
                    card_div.classList.add('ghost_card')
                    card_div.style.backgroundImage = `url(img/${g_card.suit}/${g_card.number}.png)`
                    card_div.style.top = `${index * 40}px`
                    ghost_cards.appendChild(card_div)
                })

                ghost_cards.style.position = 'absolute'
                ghost_cards.style.top = '-9999px'
                ghost_cards.style.left = '-9999px'
                document.body.appendChild(ghost_cards)

                ev.dataTransfer.setData('placeholder', '') 
                ev.dataTransfer.setDragImage(ghost_cards, 0, 0) 


                
                // upuszczenie
                ev.target.addEventListener('dragend', () => {
                    if(dragState.drop_area_check == false){
                        if(source_pile == 'draw_pile'){
                            const cardId = `${this.number}_${this.suit}`
                            const cardElem = document.getElementById(cardId)
                            cardElem.style.opacity = 100
                        }
                        else{
                            dragState.drag_source_pile.ShowCardsFrom(index)
                        }
                    }
                    else{
                        dragState.drop_area_check = false
                    }
                    dragState.drag_ghost_pile = []
                    dragState.drag_source_pile = null
                    document.getElementById('ghost_cards')?.remove()
                    
                }, { once: true })        
            }
            }
            return card
    }

}