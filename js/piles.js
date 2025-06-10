import { pasjans } from "./game.js"
import { dragState } from "./globals.js"

const as_pile_sound = new Audio('sfx/as_pile.wav')
const down_card_sound = new Audio('sfx/down_card.wav')

export class Pile{
    pile = []
    name = ''
    type = ''
    constructor(name){
        this.name = name
    }
    Clone() {
        const copy = new Pile(this.name)
        copy.type = this.type
        copy.pile = this.pile.map(card => card.Clone())
        return copy
    }
    GetMovableStackFrom(index) {
        let stack = []
        for (let i = index; i < this.pile.length; i++) {
            if (stack.length == 0) {
                stack.push(this.pile[i])
            } else {
                const previous = stack[stack.length - 1]
                const current = this.pile[i]
                if (current.number === previous.number - 1 && current.color !== previous.color) {
                    stack.push(current)
                } else {
                    break
                }
            }
        }
        {
            if(stack.length == 1 && index != this.pile.length-1){
                stack = []
            }
        }
        return stack.length > 0 ? stack : null
    }

    IsDropAllowed(cards) {
        if(this.type == 'game_pile'){
            // możliwe opuszczenie króla na puste pole
            if (this.pile.length === 0) {
                return cards[0].number === 13
            }
            const top = this.pile[this.pile.length - 1]
            return top.number === cards[0].number + 1 && top.color !== cards[0].color
        }
        if(this.type == 'as_pile'){
            if(cards.length == 1){
                if(this.pile.length == 0){ // jeśli puste to można odłożyć asa
                    return cards[0].number == 1 && cards[0].suit == this.name
                }
                else{
                    const top_card = this.pile[this.pile.length-1]
                    return cards[0].number == top_card.number+1 && cards[0].suit == top_card.suit
                }
            }
        }
        
    }

    ApplyDrop(cards) {
        this.pile.push(...cards)
        cards.forEach(card => {
            card.current_pile = this.name
        });
        pasjans.RedrawPiles()
    }

    RemoveStack(stack,uncover) {
        this.pile = this.pile.slice(0, this.pile.length - stack.length)
        if(this.pile.length > 0 && this.type == 'game_pile' && uncover == true){
            this.pile[this.pile.length-1].visible = true
        }
        pasjans.RedrawPiles()
    }

    HideCardsFrom(index) {
        for (let i = index; i < this.pile.length; i++) {
            const cardId = `${this.pile[i].number}_${this.pile[i].suit}`
            const cardElem = document.getElementById(cardId)
            if (cardElem) {
                cardElem.style.opacity = '0'
            }
        }
    }
    ShowCardsFrom(index) {
        for (let i = index; i < this.pile.length; i++) {
            const cardId = `${this.pile[i].number}_${this.pile[i].suit}`
            const cardElem = document.getElementById(cardId)
            if (cardElem) {
                cardElem.style.opacity = '100'
            }
        }
    }


    DrawPile(){

        let draw_container = document.getElementById('main_cont')
        let html_pile = document.getElementById(this.name)


        // tworzenie
        if(html_pile == null){
            html_pile = document.createElement('div')
            html_pile.id = this.name
            html_pile.classList.add('card_pile')

            if(this.type == 'as_pile'){
                html_pile.style.backgroundImage = `url(img/backs/${this.name}.png)`
                html_pile.classList.add('top_row')
            }
            
            
            // funkcje drop 
            html_pile.ondrop = (ev) => {
                // zapisywanie ruchu
                if(dragState.drag_source_pile == 'draw_pile'){
                    pasjans.saveStatus(false)
                }
                else{
                    pasjans.saveStatus(true)
                }
                ev.preventDefault()


                // obecny pile na który upuszczamy / bierze ten obiekt
                const dropped_pile = pasjans.GetPileByName(this.name)
                // console.log('upuszczam na ',dropped_pile)
                
                // jeśli istnieje pile i mamy co upuścić
                if (dropped_pile && dragState.drag_ghost_pile.length > 0 && (dropped_pile.type == 'game_pile' || dropped_pile.type == 'as_pile')) {
                    // console.log(dropped_pile.IsDropAllowed(dragState.drag_ghost_pile))
                    if (dropped_pile.IsDropAllowed(dragState.drag_ghost_pile) && dragState.drag_source_pile.name != dropped_pile.name) {  
                        // drop zakończony sukcesem
                        dropped_pile.ApplyDrop(dragState.drag_ghost_pile)
                        if(dragState.drag_source_pile != 'draw_pile'){
                            dragState.drag_source_pile.RemoveStack(dragState.drag_ghost_pile,true)
                        }
                        else{
                            let discard_field = document.getElementById('discard_field')
                            discard_field.innerHTML = ''
                        }
                        if(dropped_pile.type == 'as_pile'){
                            as_pile_sound.play()
                        }
                        else{
                            down_card_sound.play()
                        }
                        
                    }
                    else{
                        // console.log('niemożliwe upuszczenie')
                        // karta wzięta z game_pile (ponowne pojawienie się kart)
                        if(dragState.drag_source_pile != 'draw_pile'){
                            dragState.drag_source_pile.RemoveStack(dragState.drag_ghost_pile,false)
                            dragState.drag_source_pile.ApplyDrop(dragState.drag_ghost_pile)
                        }
                        // karta wzięta z draw
                        else{
                            let discard_field = document.getElementById('discard_field')
                            discard_field.childNodes[0].style.opacity = 100
                        }
                    }
                    dragState.drop_area_check = true
                }
                
                // usunięcie części graficznej przeciągania
                dragState.drag_ghost_pile = []
                dragState.drag_source_pile = null
                document.getElementById('ghost_cards')?.remove()
                
            }

            html_pile.ondragover = (ev) => ev.preventDefault()
            draw_container.append(html_pile)

        }
            
        html_pile.innerHTML = ''
        // rysowanie każdej karty na stosie
        if(this.type == 'game_pile'){
            let offset = 0
            this.pile.forEach((element,index) => {
                const cardElement = element.DrawCard(index, this);
                if(index != 0){
                    if(this.pile[index-1].visible == true){
                        offset += 40
                    }   
                    else{
                        offset += 20
                    }
                }
                cardElement.style.top = `${offset}px`
                html_pile.append(cardElement);
            });
        }

        // rysownie ostatniej odłożonej karty - as pile
        if(this.type == 'as_pile' && this.pile.length > 0){
            const top = this.pile[this.pile.length-1]
            const top_draw = top.DrawCard(0,this)
            html_pile.append(top_draw)
        }

        
    }
}