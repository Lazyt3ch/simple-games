export const gameId = 'battleship';

export const languages = [
    { short: "en", full: "English" },
    { short: "ru", full: "русский" },
]

export const gameName = {
    en: 'Battleship',
    ru: 'Морской бой',
}

export const uiStrings = {
    /*
    'game_name':
    {
        en: 'Battleship',
        ru: 'Морской бой',
    },
    */
    'start_game': 
    {   
        en: 'Start the game',
        ru: 'Начать игру',
    },
    'restart_game': 
    {   
        en: 'Restart the game',
        ru: 'Начать игру заново',
    },        
    'start_new_game': 
    {   
        en: 'Start a new game',
        ru: 'Начать новую игру',
    },    
    'stop_game': 
    {   
        en: 'Stop the game',
        ru: 'Остановить игру',
    },
    'lets_play':
    {
        en: "Let's play!",
        ru: 'Ну что, сыграем?',
    },    
    'who_plays_first':
    {
        en: "Who makes the first move?",
        ru: 'Кто сделает первый ход?',
    },
    'user_begins':
    {   
        en: 'Me',
        ru: 'Я',        
    },
    'opponent_begins':
    {
        en: 'My opponent',
        ru: 'Противник',
    },
    'game_on':
    {
        en: 'The game is on!',
        ru: 'Игра началась!',
    },

    // Battleship-specific!
    'user_move':
    {
        en: "It's your turn to fire.",
        ru: "Ваша очередь стрелять.",
    },    

    // Battleship-specific!
    'opponent_move':
    {
        en: "Wait for the opponent to fire...",
        ru: 'Подождите, пока противник выстрелит...',
    },       

    'user_won':
    {
        en: "Congratulations, you've won!",
        ru: "Поздравляю, вы победили!",
    },
    'opponent_won':
    {
        en: "Your opponent won this time!",
        ru: "На этот раз победил противник!",
    },    
    'score_draw':
    {
        en: "Nobody won this time.",
        ru: "Вы сыграли вничью.",
    },
    
    'user_ships':
    {
        en: "Your ships",
        ru: "Ваши корабли",
    },
    'opponent_ships':
    {
        en: "Enemy ships",
        ru: "Корабли противника",
    },
    'select_ship_text':
    {
        en: "Position your ships",
        ru: "Разместите свои корабли",
    },
    'select_ship':
    {
        en: "Select a ship class...",
        ru: "Выберите тип корабля...",
    },
    // Ship classes below
    'battleship':
    {
        en: "Battleship",
        ru: "Линкор",
    },
    'cruiser':
    {
        en: "Cruiser",
        ru: "Крейсер",
    },
    'destroyer':
    {
        en: "Destroyer",
        ru: "Эсминец",
    },
    'motorboat':
    {
        en: "Motorboat",
        ru: "Катер",
    },
    'unknown':
    {
        en: "What is this???",
        ru: "Что это???",
    },
    // Table listing ship classes, sizes, quantities, etc
    'class':
    {
        en: "Class",
        ru: "Тип",
    },
    'size':
    {
        en: "Size",
        ru: "Размер",
    },
    'total_number':
    {
        en: "Total number",
        ru: "Численность",
    },
    'to_be_positioned':
    {
        en: "To be positioned",
        ru: "Еще не размещены",
    },

    // popup messages
    'cannot_position_here':
    {
        // en: "You cannot position a ship here!",
        // ru: "Здесь нельзя разместить корабль!",
        en: "A ship must not touch any other ships!",
        ru: "Корабль не должен касаться других кораблей!",
    },

    'invalid_ship_size':
    {
        en: "That would create a ship of incorrect size!",
        ru: "Так получится корабль неправильного размера!",
    },

    'position_ships':
    {
        en: "First, you need to position all of your ships on the board. <br />" +
            "See the table for hints what is missing or excessive.",
        ru: "Для начала разместите все свои корабли на доске. <br />" + 
            "Таблица подскажет, чего не хватает, а что лишнее.",
    },

    'but_who_begins':
    {
        en: "You also need to decide who makes the first move.",
        ru: "Осталось только решить, кто сделает первый ход.",
    },        

    'can_start_now':
    {
        // en: "Now decide who makes the first move, and start playing!",
        // ru: "Осталось решить, кто сделает первый ход, и начать игру!",
        en: "You can start the game now!",
        ru: "Теперь можно начать игру!",
    },    

    'game_on':
    {
        // en: "Now decide who makes the first move, and start playing!",
        // ru: "Осталось решить, кто сделает первый ход, и начать игру!",
        en: "The game is on!",
        ru: "Игра началась!",
    },       
    
    'oppo_ship_missed':
    {
        en: "Sorry, you've missed.",
        ru: "К сожалению, вы промахнулись.",
    },       
    'oppo_ship_hit':
    {
        en: "Good job! You've hit an enemy ship!",
        ru: "Отлично, вы попали во вражеский корабль!",
    },            
    'oppo_ship_sunk':
    {
        en: "Excellent! You've sunk an enemy ship!!!",
        ru: "Превосходно, вы потопили вражеский корабль!!!",
    },        

    'user_ship_missed':
    {
        en: "The opponent has fired but missed.",
        ru: "Противник выстрелил и промахнулся.",
    },       
    'user_ship_hit':
    {
        en: "The opponent has hit a ship of yours!",
        ru: "Противник попал в ваш корабль!",
    },          
    'user_ship_sunk':
    {
        en: "The opponent has sunk a ship of yours!",
        ru: "Противник потопил ваш корабль!",
    },       
    
    'no_use_firing_here':
    {
        en: "It doesn't make sense firing at this cell!",
        ru: "Нет никакого смысла стрелять в эту ячейку!",
    },       
        

}