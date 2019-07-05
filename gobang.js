window.onload = () => {
    var ui = new UI(true, 4); // 初始 执白子、难度中等
};

//-- UI 类 --
class UI {
    //-- 初始化 --
    /**
     * 进行一些 UI 的初始化操作
     * 包括：
     *  * 初始页构建
     *  * 棋盘点击事件绑定
     *  * 等
     * @param {boolean} isFirst - AI 是否先手
     * @param {number} considerDepth - AI 向下考虑层数
     * @constructor
     */
    constructor(isFirst, considerDepth) {
        this.whoseTurn = isFirst ? false : true; // false:player,true:AI
        this.isFirst = isFirst;
        this.sideArray = ['执&nbsp;白', '执&nbsp;黑'];
        this.difficultyArray = ['简&nbsp;单', '中&nbsp;等', '困&nbsp;难', '究&nbsp;极'];
        this.chosenSideIndex = 0;
        this.chosenDifficultyIndex = 1;

        //-- 读秒、轮数计数器
        this.seconds = 0;
        this.round = 0;

        //-- 行棋标记相关
        this.lastAimIndexX = -1;
        this.lastAimIndexY = -1;

        //-- 棋局终止
        this.oneSideWon = false;

        this.createItems();
        this.ai = new AI(considerDepth, 1/6, 11);
        this.setAIListener();
    }

    //-- 全局
    /**
     * 开始按钮等 UI 初始化
     * @returns {boolean} 是否成功创建
     */
    createItems() {
        //-- 创建
        $('body').append('<div id="startBtn"><p id="innerText">开&nbsp;始</p></div>', `<div id="whichSide"><span id="lastSide" class="adjustBtn">&#139;</span>&nbsp;&nbsp;<span id="chosenSide">${this.sideArray[this.chosenSideIndex]}</span>&nbsp;&nbsp;<span id="nextSide" class="adjustBtn">&#155;</span></div>`, `<div id="whichDifficulty"><span id="lastDifficulty" class="adjustBtn">&#139;</span>&nbsp;&nbsp;<span id="chosenDifficulty">${this.difficultyArray[this.chosenDifficultyIndex]}</span>&nbsp;&nbsp;<span id="nextDifficulty" class="adjustBtn">&#155;</span></div>`);

        //-- 绑定功能
        $('#startBtn').mousedown(() => {
            $('#startBtn').animate({
                width: '9%',
                height: '9%',
                left: '45.5%',
                top: '60.5%',
                lineHeight: '65px',
                background: 'rgb(245, 152, 136)'
            }, 100);
        });
        $('#startBtn').click(() => {
            this.isFirst = this.chosenSideIndex == 1 ? false : true;
            this.ai.considerDepth = (this.chosenDifficultyIndex + 1) * 2;
            this.createBubble(100);
            this.bubbleMove(500);
            this.deleteItems();
            this.createChessboard();
        });

        $('#nextSide').click(() => {
            $('#chosenSide').html(this.sideArray[this.chosenSideIndex == 1 ? this.chosenSideIndex : ++this.chosenSideIndex]);
        });
        $('#lastSide').click(() => {
            $('#chosenSide').html(this.sideArray[this.chosenSideIndex == 0 ? this.chosenSideIndex : --this.chosenSideIndex]);
        });
        $('#nextDifficulty').click(() => {
            $('#chosenDifficulty').html(this.difficultyArray[this.chosenDifficultyIndex == 3 ? this.chosenDifficultyIndex : ++this.chosenDifficultyIndex]);
        });
        $('#lastDifficulty').click(() => {
            $('#chosenDifficulty').html(this.difficultyArray[this.chosenDifficultyIndex == 0 ? this.chosenDifficultyIndex : --this.chosenDifficultyIndex]);
        });

        return true;
    }

    /**
     * 删除开始按钮
     * @returns {boolean} - 是否成功删除
     */
    deleteItems() {
        $('#startBtn').remove();
        $('#whichSide').remove();
        $('#whichDifficulty').remove();
        return true;
    }


    /**
     * 在随机位置生成气泡
     * @param {number} amt - 气泡总数量
     * @returns {boolean} 是否成功生成
     */
    createBubble(amt) {
        for (var i = 0; i < amt; i++) {
            var x = Math.floor(Math.random() * 100);
            var y = Math.floor(Math.random() * 100);
            var h = Math.floor(Math.random() * 100);
            $('body').append(`<canvas class="bubble" style="width:200px;position:fixed;bottom:${h}%;left:${x}%;top:${y}%;background:transparent;opacity:1;">canvas is not supported.</canvas>`);
        }
        var bubbles = $('.bubble');
        for (var i of bubbles) {
            var ctx = i.getContext('2d');
            ctx.strokeStyle = '#' + Math.floor(Math.random() * 100000000 % 0xFFFFFF).toString(16);
            ctx.arc(30, 30, 10, 0, 2 * Math.PI);
            ctx.stroke();
        }
        return true;
    }

    /**
     * 将所有的气泡移动一些距离
     * @param {number} speed - 速度，毫秒
     * @returns {boolean} 是否成功移动
     */
    bubbleMove(speed) {
        var bubbles = $('.bubble');
        for (var i = 0; i < bubbles.length; i++) {
            var x = Math.floor(Math.random() * 100);
            var y = Math.floor(Math.random() * 100);
            var h = Math.floor(Math.random() * 100);
            $(`.bubble:eq(${i})`).animate({
                left: `${x}%`,
                top: `${y}%`,
                bottom: `${h}%`
            }, speed);
        }
        return true;
    }

    //-- 棋盘
    /**
     * 创建棋盘 - #F17C67 & #EDEDED 
     * @returns {boolean} 是否成功创建 
     */
    createChessboard() {
        $('body').append('<div id="chessboard"><canvas id="glass" width="645" height="645"></canvas></div>', '<div id="roundCounter"><p>R O U N D</p><span id="hundred" style="margin:4px;background:#fff;padding:5px 6px 5px 6px;border-radius:3px;color:#cc0033;">0</span><span id="ten" style="margin:4px;background:#fff;padding:5px 6px 5px 6px;border-radius:3px;color:#cc0033;">0</span><span id="individual" style="margin:4px;background:#fff;padding:5px 6px 5px 6px;border-radius:3px;color:#cc0033;">0</span></div>', `<div id="seconds">${this.seconds}</div>`, '<div id="backward" style="width:150px;height:100px;position:fixed;bottom:4%;left:9.5%;font-size:48px;text-align:center;cursor:default;"><span class="adjustBtn backward" style="border-radius:25%;padding:2px 20px 2px 20px;background:#cc0033;">&#8629;</span></div>');
        $('#chessboard').animate({
            width: '44%',
            height: '92%',
            top: '4%',
            left: '28%'
        }, 500);

        //-- 读秒监听设置
        this.setSecondsListener();

        //-- 设置返回、悔棋点击事件
        $('.backward').click(() => {
            window.location.reload();
        });

        //--  draw line
        var ctx = document.getElementById('glass').getContext('2d');
        ctx.strokeStyle = '#EDEDED';
        ctx.lineWidth = '1';
        var x = 40;
        var y = 5;
        // vertical & horizontal
        ctx.beginPath();
        for (var i = 0; i < 15; i++) {
            ctx.moveTo(x + i * 40 + 1.5, y);
            ctx.lineTo(x + i * 40 + 1.5, y + 635);
            ctx.moveTo(y, x + i * 40 + 1.5);
            ctx.lineTo(y + 635, x + i * 40 + 1.5);
            ctx.stroke();
        }
        ctx.closePath();

        //-- 如果 AI 先手，下天元
        setTimeout(() => {
            if (this.isFirst) {
                this.ai.thesePieces[7][7] = this.ai.yoghurt;
                this.ai.hashKey ^= this.ai.zobristHash[7][7][0] ^ this.ai.zobristHash[7][7][1];
                this.setOnePiece(7, 7, false);
            }
        }, 600);

        //-- onclick event
        $('#glass').click((ev) => {
            //-- 确定落点
            var aimIndexX = (Math.floor(parseInt(ev.offsetX - 40) / 40 + 1) * 40 - parseInt(ev.offsetX - 40)) >= 20 ? Math.floor(parseInt(ev.offsetX - 40) / 40) : Math.floor(parseInt(ev.offsetX - 40) / 40) + 1;
            var aimIndexY = (Math.floor(parseInt(ev.offsetY - 40) / 40 + 1) * 40 - parseInt(ev.offsetY - 40)) >= 20 ? Math.floor(parseInt(ev.offsetY - 40) / 40) : Math.floor(parseInt(ev.offsetY - 40) / 40) + 1;
            if (!this.ai.thesePieces[aimIndexY][aimIndexX] && !this.whoseTurn && !this.oneSideWon) {
                //-- 秒数归零
                this.seconds = -1;

                this.setOnePiece(aimIndexX, aimIndexY, this.isFirst ? true : false);
                this.ai.thesePieces[aimIndexY][aimIndexX] = this.ai.oreo;
                this.ai.hashKey ^= this.ai.zobristHash[aimIndexY][aimIndexX][0] ^ this.ai.zobristHash[aimIndexY][aimIndexX][2];
                this.bubbleMove(500);
                this.whoseTurn = !this.whoseTurn;

                //-- 轮数计数器
                if (this.isFirst) {
                    $('#hundred').text(Math.floor(++this.round / 100));
                    $('#ten').text(Math.floor((this.round - 100 * Math.floor(this.round / 100)) / 10));
                    $('#individual').text(this.round - 100 * Math.floor(this.round / 100) - 10 * Math.floor((this.round - 100 * Math.floor(this.round / 100)) / 10));
                }

                //-- 检查玩家是否获胜
                var checkWin = this.ai.evalSitu()['hasWon'];
                if (checkWin == this.ai.oreo || checkWin == this.ai.tie) {
                    this.oneSideWon = true;
                    this.showResult(checkWin);
                }
            }
        });
    }

    /**
     * 放置棋子至指定位置
     * @param {number} aimIndexX - 行数索引 (0,1,2,...) 
     * @param {number} aimIndexY - 列数索引 (0,1,2,...) 
     * @param {boolean} whoseTurn - 放置棋子类型 (true:白,false:黑)
     * @returns {boolean} 是否成功放置
     */
    setOnePiece(aimIndexX, aimIndexY, whoseTurn) {
        var ctx = document.getElementById('glass').getContext('2d');

        //-- 擦除上一次标记
        if (this.lastAimIndexX != -1) {
            ctx.beginPath();
            ctx.fillStyle = whoseTurn ? '#000' : '#fff';
            ctx.arc(40 + this.lastAimIndexX * 40 + 1.5, 40 + this.lastAimIndexY * 40 + 1.5, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }

        ctx = document.getElementById('glass').getContext('2d');
        ctx.beginPath();
        ctx.fillStyle = whoseTurn ? '#fff' : '#000';
        ctx.arc(40 + aimIndexX * 40 + 1.5, 40 + aimIndexY * 40 + 1.5, 19, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        //-- 行棋标记
        ctx.beginPath();
        ctx.fillStyle = '#cc0033';
        ctx.arc(40 + aimIndexX * 40 + 1.5, 40 + aimIndexY * 40 + 1.5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        this.lastAimIndexX = aimIndexX;
        this.lastAimIndexY = aimIndexY;

        return true;
    }

    /**
     * 玩家落子监听函数（玩家落子后，得到 AI 的决策）
     * @returns {boolean} 是否成功设置监听
     */
    setAIListener() {
        setInterval(() => {
            if (this.whoseTurn && !this.oneSideWon) {
                //-- 秒数归零
                this.seconds = -1;

                var res = this.ai.chooseNextMove(this.ai.considerDepth, this.ai.yoghurt, this.ai.inf, this.ai.hashKey);
                this.setOnePiece(res['aimIndexY'], res['aimIndexX'], this.isFirst ? false : true);
                this.ai.thesePieces[res['aimIndexX']][res['aimIndexY']] = this.ai.yoghurt;
                this.ai.hashKey ^= this.ai.zobristHash[res['aimIndexX']][res['aimIndexY']][0] ^ this.ai.zobristHash[res['aimIndexX']][res['aimIndexY']][1];
                this.bubbleMove(500);
                this.whoseTurn = !this.whoseTurn;

                //-- 轮数计数器
                if (!this.isFirst) {
                    $('#hundred').text(Math.floor(++this.round / 100));
                    $('#ten').text(Math.floor((this.round - 100 * Math.floor(this.round / 100)) / 10));
                    $('#individual').text(this.round - 100 * Math.floor(this.round / 100) - 10 * Math.floor((this.round - 100 * Math.floor(this.round / 100)) / 10));
                }

                //-- 检查 AI 是否获胜
                var checkWin = this.ai.evalSitu()['hasWon'];
                if (checkWin == this.ai.yoghurt || checkWin == this.ai.tie) {
                    this.oneSideWon = true;
                    this.showResult(checkWin);
                }
            }
        }, 500);
    }

    /**
     * 读秒监听函数
     * @returns {boolean} 是否成功设置
     */
    setSecondsListener() {
        setInterval(() => {
            if (!this.oneSideWon) {
                if (++this.seconds >= 100) {
                    $('#seconds').css({
                        top: '18%'
                    });
                    $('#seconds').text('...');

                } else {
                    $('#seconds').text(this.seconds);
                    $('#seconds').animate({
                        fontSize: '200px',
                        top: '27%',
                        right: '4%'
                    }, 100);
                    $('#seconds').animate({
                        fontSize: '240px',
                        top: '28%',
                        right: '5.5%'
                    }, 400);
                }
            } else {
                $('#seconds').remove();
            }
        }, 1000);
        return true;
    }

    /**
     * 对局结果展现函数
     * @param {number} whoWon - 取值：yoghurt/oreo/tie
     * @returns {boolean} 是否成功展现
     */
    showResult(whoWon) {
        $('body').append('<div id="coverLayer" style="width:100%;height:100%;background:#fff;opacity:0.8;"></div>', `<div id="tellResult"><p style="margin-top:115px;"><span style="display:block;">${whoWon==this.ai.tie?'平':(whoWon==this.ai.yoghurt?(this.isFirst?'黑胜':'白胜'):(this.isFirst?'白胜':'黑胜'))}!</span><br><br><span class="adjustBtn backward">&#8629;</span>&nbsp;&nbsp;<span id="seeResult" class="adjustBtn">&#9728;</span>&nbsp;&nbsp;<span id="onceAgain" class="adjustBtn">&#8635;</span></p></div>`);
        $('#tellResult').animate({
            width: '50%',
            height: '46%',
            top: '27%',
            left: '25%'
        }, 100);
        $('.backward').click(() => {
            window.location.reload();
        });
        $('#seeResult').click(() => {
            $('#coverLayer').remove();
            $('#tellResult').remove();
        });
        $('#onceAgain').click(() => {
            this.ai = new AI((this.chosenDifficultyIndex + 1) * 2, 1 / 3, 5);
            this.seconds = 0;
            this.lastAimIndexX = -1;
            this.lastAimIndexY = -1;
            this.oneSideWon = false;
            $('#lastRound').remove();
            $('.backward').remove();
            $('#roundCounter').remove();
            $('#seconds').remove();
            $('#coverLayer').remove();
            $('#tellResult').remove();
            $('#chessboard').remove();
            this.createChessboard();
        });
    }
}

//-- AI 类 --
class AI {
    /**
     * AI 的初始设置
     * @param {number} considerDepth - AI 向下思考层数
     * @param {number} ratioLeftCand - 候选节点保留比例
     * @param {number} thresholdCand - 候选节点是否舍去的决策阈值
     * @constructor
     */
    constructor(considerDepth, ratioLeftCand, thresholdCand) {
        //-- 棋局存储数组的创建、初始化
        this.thesePieces = new Array(15);
        for (var i = 0; i < 15; i++) {
            this.thesePieces[i] = new Array(15);
            for (var j = 0; j < 15; j++) {
                this.thesePieces[i][j] = 0;
            }
        }

        //-- 一些特殊值
        this.oreo = -1;
        this.yoghurt = 1;
        this.empty = 0;
        this.both = -11;
        this.tie = 55; // 五五开
        this.inf = 999999999;
        this.considerDepth = considerDepth;
        this.ratioLeftCand = ratioLeftCand;
        this.thresholdCand = thresholdCand;

        //-- 置换表相关
        this.zobristHash = new Array();
        for (var i = 0; i < 15; i++) {
            this.zobristHash[i] = new Array();
            for (var j = 0; j < 15; j++) {
                this.zobristHash[i][j] = new Array();
                for (var k = 0; k < 3; k++) {
                    this.zobristHash[i][j][k] = Math.floor(Math.random() * Math.pow(10, 17));
                }

            }
        }
        this.transTable = {};
        this.hashKey = this.getZobristHash();
    }

    /**
     * 棋局评估函数
     * @returns {object} 一个包含棋局评估结果的对象，其属性如下：
     *                     * score:    棋局得分，得分越高对 AI 越有利
     *                     * willWin_3:  yoghurt 存在双三：1，oreo 存在双三：-1，皆存在：-11，否则：0
     *                     * willWin_4: yoghurt 存在活四：1，oreo 存在活四：-1，皆存在：-11，否则：0
     *                     * hasWon:   yoghurt won（存在成五（以及大于五子））：1，oreo won: -1，都赢了（虽然不可能）：-11，else: 0
     */
    evalSitu() {
        var scoreOreo = 0,
            scoreYoghurt = 0,
            amtOfOccupied = 0;
        var flagPositiveThree = this.empty,
            flagDoubleThree = this.empty,
            flagPositiveFour = this.empty,
            flagHasWon = this.empty;
        for (var k = 0; k < 6; k++) {
            //-- 四个方向，六次迭代
            for (var i = 0; i < 15; i++) {
                //-- 逐行计分
                var flagLeft = false,
                    flagRight = false; // 左右标志 (true:not available)
                var hopeFor = this.empty; // 期望棋子类型 (0:the position is available,-1:oreo,1:yoghurt)
                var amtOfPieces = 0; // 棋子数计数器
                for (var j = 0; j < 15; j++) {
                    var actualI = k == 0 ? i : (k == 1 ? j : (k == 2 ? j : (k == 3 ? j + i + 1 : (k == 4 ? i - j : 14 - j))));
                    var actualJ = k == 0 ? j : (k == 1 ? i : (k == 2 ? 14 - i + j : (k == 3 ? j : (k == 4 ? j : i + j + 1))));
                    if (actualI <= 14 && actualI >= 0 && actualJ <= 14 && actualJ >= 0) {
                        switch (this.thesePieces[actualI][actualJ]) {
                            case this.yoghurt:
                                {
                                    amtOfOccupied++;
                                    switch (hopeFor) {
                                        case this.empty:
                                            {
                                                if (j > 0) {
                                                    flagLeft = false;
                                                } else {
                                                    flagLeft = true;
                                                }
                                                amtOfPieces = 0;
                                                amtOfPieces++;
                                                hopeFor = this.yoghurt;
                                            }
                                            break;
                                        case this.oreo:
                                            {
                                                //-- 结算 oreo 得分 --
                                                flagRight = true;
                                                //-- 校验标志
                                                if (amtOfPieces >= 5) {
                                                    flagHasWon = flagHasWon == this.yoghurt ? this.both : this.oreo;
                                                } else if (amtOfPieces == 4 && !flagLeft && !flagRight) {
                                                    flagPositiveFour = flagPositiveFour == this.yoghurt ? this.both : this.oreo;
                                                } else if (amtOfPieces == 3 && !flagLeft && !flagRight) {
                                                    if (flagPositiveThree == this.oreo || flagPositiveThree == this.both) {
                                                        flagDoubleThree = flagDoubleThree == this.yoghurt ? this.both : this.oreo;
                                                    } else {
                                                        flagPositiveThree = flagPositiveThree == this.yoghurt ? this.both : this.oreo;
                                                    }
                                                }
                                                //-- 计算得分
                                                scoreOreo += (flagLeft && flagRight) ? Math.pow(10, amtOfPieces >= 5 ? amtOfPieces : 0) : ((!flagLeft && !flagRight) ? Math.pow(10, amtOfPieces) : Math.pow(10, amtOfPieces >= 5 ? amtOfPieces : amtOfPieces - 1));

                                                //-- 重设计数器、左右标志等 --
                                                flagLeft = true;
                                                flagRight = false;
                                                amtOfPieces = 0;
                                                amtOfPieces++;
                                                hopeFor = this.yoghurt;
                                            }
                                            break;
                                        case this.yoghurt:
                                            {
                                                amtOfPieces++;
                                            }
                                            break;
                                        default:
                                            break;
                                    }
                                }
                                break;
                            case this.oreo:
                                {
                                    amtOfOccupied++;
                                    switch (hopeFor) {
                                        case this.empty:
                                            {
                                                if (j > 0) {
                                                    flagLeft = false;
                                                } else {
                                                    flagLeft = true;
                                                }
                                                amtOfPieces = 0;
                                                amtOfPieces++;
                                                hopeFor = this.oreo;
                                            }
                                            break;
                                        case this.oreo:
                                            {
                                                amtOfPieces++;
                                            }
                                            break;
                                        case this.yoghurt:
                                            {
                                                //-- --
                                                flagRight = true;
                                                //--
                                                if (amtOfPieces >= 5) {
                                                    flagHasWon = flagHasWon == this.oreo ? this.both : this.yoghurt;
                                                } else if (amtOfPieces == 4 && !flagLeft && !flagRight) {
                                                    flagPositiveFour = flagPositiveFour == this.oreo ? this.both : this.yoghurt;
                                                } else if (amtOfPieces == 3 && !flagLeft && !flagRight) {
                                                    if (flagPositiveThree == this.yoghurt || flagPositiveThree == this.both) {
                                                        flagDoubleThree = flagDoubleThree == this.oreo ? this.both : this.yoghurt;
                                                    } else {
                                                        flagPositiveThree = flagPositiveThree == this.oreo ? this.both : this.yoghurt;
                                                    }
                                                }
                                                //--
                                                scoreYoghurt += (flagLeft && flagRight) ? Math.pow(10, amtOfPieces >= 5 ? amtOfPieces : 0) : ((!flagLeft && !flagRight) ? Math.pow(10, amtOfPieces) : Math.pow(10, amtOfPieces >= 5 ? amtOfPieces : amtOfPieces - 1));

                                                //-- --
                                                flagLeft = true;
                                                flagRight = false;
                                                amtOfPieces = 0;
                                                amtOfPieces++;
                                                hopeFor = this.oreo;
                                            }
                                            break;
                                        default:
                                            break;
                                    }
                                }
                                break;
                            case this.empty:
                                {
                                    switch (hopeFor) {
                                        case this.empty:
                                            {
                                                continue;
                                            }
                                            break;
                                        case this.oreo:
                                            {
                                                //-- --
                                                flagRight = false;
                                                //-- 校验标志
                                                if (amtOfPieces >= 5) {
                                                    flagHasWon = flagHasWon == this.yoghurt ? this.both : this.oreo;
                                                } else if (amtOfPieces == 4 && !flagLeft && !flagRight) {
                                                    flagPositiveFour = flagPositiveFour == this.yoghurt ? this.both : this.oreo;
                                                } else if (amtOfPieces == 3 && !flagLeft && !flagRight) {
                                                    if (flagPositiveThree == this.oreo || flagPositiveThree == this.both) {
                                                        flagDoubleThree = flagDoubleThree == this.yoghurt ? this.both : this.oreo;
                                                    } else {
                                                        flagPositiveThree = flagPositiveThree == this.yoghurt ? this.both : this.oreo;
                                                    }
                                                }
                                                //-- 计算得分
                                                scoreOreo += (flagLeft && flagRight) ? Math.pow(10, amtOfPieces >= 5 ? amtOfPieces : 0) : ((!flagLeft && !flagRight) ? Math.pow(10, amtOfPieces) : Math.pow(10, amtOfPieces >= 5 ? amtOfPieces : amtOfPieces - 1));

                                                //-- 重设计数器、左右标志等 --
                                                flagLeft = false;
                                                flagRight = false;
                                                amtOfPieces = 0;
                                                hopeFor = this.empty;
                                            }
                                            break;
                                        case this.yoghurt:
                                            {
                                                //-- --
                                                flagRight = false;
                                                //--
                                                if (amtOfPieces >= 5) {
                                                    flagHasWon = flagHasWon == this.oreo ? this.both : this.yoghurt;
                                                } else if (amtOfPieces == 4 && !flagLeft && !flagRight) {
                                                    flagPositiveFour = flagPositiveFour == this.oreo ? this.both : this.yoghurt;
                                                } else if (amtOfPieces == 3 && !flagLeft && !flagRight) {
                                                    if (flagPositiveThree == this.yoghurt || flagPositiveThree == this.both) {
                                                        flagDoubleThree = flagDoubleThree == this.oreo ? this.both : this.yoghurt;
                                                    } else {
                                                        flagPositiveThree = flagPositiveThree == this.oreo ? this.both : this.yoghurt;
                                                    }
                                                }
                                                //--
                                                scoreYoghurt += (flagLeft && flagRight) ? Math.pow(10, amtOfPieces >= 5 ? amtOfPieces : 0) : ((!flagLeft && !flagRight) ? Math.pow(10, amtOfPieces) : Math.pow(10, amtOfPieces >= 5 ? amtOfPieces : amtOfPieces - 1));

                                                //-- --
                                                flagLeft = false;
                                                flagRight = false;
                                                amtOfPieces = 0;
                                                hopeFor = this.empty;
                                            }
                                        default:
                                            break;
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }
                //-- 棋盘右边界善后
                switch (hopeFor) {
                    case this.oreo:
                        {
                            //-- --
                            flagRight = true;
                            //-- 校验标志
                            if (amtOfPieces >= 5) {
                                flagHasWon = flagHasWon == this.yoghurt ? this.both : this.oreo;
                            } else if (amtOfPieces == 4 && !flagLeft && !flagRight) {
                                flagPositiveFour = flagPositiveFour == this.yoghurt ? this.both : this.oreo;
                            } else if (amtOfPieces == 3 && !flagLeft && !flagRight) {
                                if (flagPositiveThree == this.oreo || flagPositiveThree == this.both) {
                                    flagDoubleThree = flagDoubleThree == this.yoghurt ? this.both : this.oreo;
                                } else {
                                    flagPositiveThree = flagPositiveThree == this.yoghurt ? this.both : this.oreo;
                                }
                            }
                            //-- 计算得分
                            scoreOreo += (flagLeft && flagRight) ? Math.pow(10, amtOfPieces >= 5 ? amtOfPieces : 0) : ((!flagLeft && !flagRight) ? Math.pow(10, amtOfPieces) : Math.pow(10, amtOfPieces >= 5 ? amtOfPieces : amtOfPieces - 1));
                        }
                        break;
                    case this.yoghurt:
                        {
                            //-- --
                            flagRight = true;
                            //--
                            if (amtOfPieces >= 5) {
                                flagHasWon = flagHasWon == this.oreo ? this.both : this.yoghurt;
                            } else if (amtOfPieces == 4 && !flagLeft && !flagRight) {
                                flagPositiveFour = flagPositiveFour == this.oreo ? this.both : this.yoghurt;
                            } else if (amtOfPieces == 3 && !flagLeft && !flagRight) {
                                if (flagPositiveThree == this.yoghurt || flagPositiveThree == this.both) {
                                    flagDoubleThree = flagDoubleThree == this.oreo ? this.both : this.yoghurt;
                                } else {
                                    flagPositiveThree = flagPositiveThree == this.oreo ? this.both : this.yoghurt;
                                }
                            }
                            //--
                            scoreYoghurt += (flagLeft && flagRight) ? Math.pow(10, amtOfPieces >= 5 ? amtOfPieces : 0) : ((!flagLeft && !flagRight) ? Math.pow(10, amtOfPieces) : Math.pow(10, amtOfPieces >= 5 ? amtOfPieces : amtOfPieces - 1));
                        }
                        break;
                    default:
                        break;
                }
            }
        }
        return {
            'score': scoreYoghurt - scoreOreo,
            'willWin_3': flagDoubleThree,
            'willWin_4': flagPositiveFour,
            'hasWon': (amtOfOccupied == 15 * 15 && flagHasWon == this.empty) ? this.tie : flagHasWon
        };
    }

    /**
     * 候选位置判断函数
     * 侯选位置满足
     * * 有邻居（步长为一）
     * * 位置上无棋子
     * @param {number} aimIndexX - 目标位置行 
     * @param {number} aimIndexY - 目标位置列 
     * @returns {boolean} 是否为侯选位置
     */
    judgeWhetherCand(aimIndexX, aimIndexY) {
        if (this.thesePieces[aimIndexX][aimIndexY]) {
            return false;
        } else {
            for (var i = -2; i <= 2; i++) {
                for (var j = -2; j <= 2; j++) {
                    var actualI = aimIndexX + i;
                    var actualJ = aimIndexY + j;
                    if (actualI >= 0 && actualI <= 14 && actualJ >= 0 && actualJ <= 14) {
                        if (this.thesePieces[actualI][actualJ]) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    }

    /**
     * 侯选位置筛选、排序函数：以候选位置的得分排序，并舍去若干低分（极小层则是高分）位置
     * @param {number} whoseTurn - 谁的回合
     * @param {number} ratio - 保留前 侯选位置总数*ratio 个最终候选位置
     * @param {number} threshold - 当侯选位置数目大于阈值时进行舍去操作
     * @returns {Array} 包含 所有最终保留的、排好序的候选位置对象 的数组
     */
    getOrderedCand(whoseTurn, ratio, threshold) {
        var allCand = [];
        for (var i = 0; i < 15; i++) {
            for (var j = 0; j < 15; j++) {
                if (this.judgeWhetherCand(i, j)) {
                    this.thesePieces[i][j] = whoseTurn;
                    allCand.push({
                        'aimIndexX': i,
                        'aimIndexY': j,
                        'finalScore': this.evalSitu()['score']
                    });
                    this.thesePieces[i][j] = this.empty;
                }
            }
        }

        for (var i = 0; i < allCand.length - 1; i++) {
            for (var j = 0; j < allCand.length - 1 - i; j++) {
                if (whoseTurn == this.yoghurt ? allCand[j]['finalScore'] < allCand[j + 1]['finalScore'] : allCand[j]['finalScore'] > allCand[j + 1]['finalScore']) {
                    var tmpCand = allCand[j];
                    allCand[j] = allCand[j + 1];
                    allCand[j + 1] = tmpCand;
                }
            }
        }

        if (allCand.length <= threshold) {
            return allCand;
        } else { // 排序
            return allCand.slice(0, threshold);
        }
    }

    /**
     * 哈希值获取函数：获取当前棋局的 zobrist hash 值
     * @returns {number} 当前棋局的哈希值
     */
    getZobristHash() {
        var res = 0;
        for (var i = 0; i < 15; i++) {
            for (var j = 0; j < 15; j++) {
                res ^= this.zobristHash[i][j][this.thesePieces[i][j] == this.oreo ? 2 : (this.thesePieces[i][j] ? 1 : 0)];
            }
        }
        return res;
    }

    /**
     * 决策函数
     * @param {number} aimDepth - 向下探索的深度
     * @param {number} whoseTurn - 谁的回合
     * @param {number} alphaOrBeta - 极小层传入 alpha（极大），极大层传入 beta（极小）
     * @param {number} hashKey - 当前棋局的哈希值，即置换表中的 key
     * @returns {object} 一个包含落子位置以及多层搜索后最终得分的对象：
     *                     * aimIndexX:    目标落点行
     *                     * aimIndexX:    目标落点行
     *                     * finalScore:   最终得分
     */
    chooseNextMove(aimDepth, whoseTurn, alphaOrBeta, hashKey) {
        //-- 极大层
        if (whoseTurn == this.yoghurt) {
            if (this.transTable[hashKey] && this.transTable[hashKey]['alpha']) {
                if (this.transTable[hashKey]['alpha']['considerDepth'] >= aimDepth) {
                    return {
                        'aimIndexX': this.transTable[hashKey]['alpha']['aimIndexX'],
                        'aimIndexY': this.transTable[hashKey]['alpha']['aimIndexY'],
                        'finalScore': this.transTable[hashKey]['alpha']['finalScore']
                    };
                }
            }

            //-- 置换表未命中则常规操作
            var extreme = {
                'aimIndexX': this.inf,
                'aimIndexY': this.inf,
                'finalScore': -this.inf
            };
            for (var c of this.getOrderedCand(whoseTurn, this.ratioLeftCand, this.thresholdCand)) {
                var i = c['aimIndexX'],
                    j = c['aimIndexY'];

                this.thesePieces[i][j] = this.yoghurt;
                if (aimDepth == this.considerDepth) {
                    //-- 绝杀等的讨论
                    var tmpRes = this.evalSitu();
                    if (tmpRes['hasWon'] == this.yoghurt) { // 成五
                        this.thesePieces[i][j] = this.empty;
                        return {
                            'aimIndexX': i,
                            'aimIndexY': j,
                            'finalScore': this.inf
                        };
                    } else if (tmpRes['willWin_4'] == this.yoghurt) { // 活四
                        //-- 判断己方是否另外存在可成五子的位置
                        this.thesePieces[i][j] = this.empty;
                        for (var m = 0; m < 15; m++) {
                            for (var n = 0; n < 15; n++) {
                                if (this.judgeWhetherCand(m, n) && !(m == i && n == j)) {
                                    this.thesePieces[m][n] = this.yoghurt;
                                    if (this.evalSitu()['hasWon'] == this.yoghurt) {
                                        this.thesePieces[m][n] = this.empty;
                                        return {
                                            'aimIndexX': m,
                                            'aimIndexY': n,
                                            'finalScore': this.inf
                                        };
                                    }
                                    this.thesePieces[m][n] = this.empty;
                                }
                            }
                        }
                        this.thesePieces[i][j] = this.yoghurt;
                        //-- 判断对手下一步能否成五子
                        for (var m = 0; m < 15; m++) {
                            for (var n = 0; n < 15; n++) {
                                if (this.judgeWhetherCand(m, n)) {
                                    this.thesePieces[m][n] = this.oreo;
                                    if (this.evalSitu()['hasWon'] == this.oreo) {
                                        this.thesePieces[m][n] = this.empty;
                                        this.thesePieces[i][j] = this.empty;
                                        return {
                                            'aimIndexX': m,
                                            'aimIndexY': n,
                                            'finalScore': this.inf
                                        };
                                    }
                                    this.thesePieces[m][n] = this.empty;
                                }
                            }
                        }
                        this.thesePieces[i][j] = this.empty;
                        //-- 否则落子此位置
                        return {
                            'aimIndexX': i,
                            'aimIndexY': j,
                            'finalScore': this.inf
                        };
                    } else if (tmpRes['willWin_3'] == this.yoghurt) { // 双三
                        //-- 判断己方是否另外存在可成五子的位置
                        this.thesePieces[i][j] = this.empty;
                        for (var m = 0; m < 15; m++) {
                            for (var n = 0; n < 15; n++) {
                                if (this.judgeWhetherCand(m, n) && !(m == i && n == j)) {
                                    this.thesePieces[m][n] = this.yoghurt;
                                    if (this.evalSitu()['hasWon'] == this.yoghurt) {
                                        this.thesePieces[m][n] = this.empty;
                                        return {
                                            'aimIndexX': m,
                                            'aimIndexY': n,
                                            'finalScore': this.inf
                                        };
                                    }
                                    this.thesePieces[m][n] = this.empty;
                                }
                            }
                        }
                        this.thesePieces[i][j] = this.yoghurt;
                        //-- 判断对手下一步能否成五子
                        for (var m = 0; m < 15; m++) {
                            for (var n = 0; n < 15; n++) {
                                if (this.judgeWhetherCand(m, n)) {
                                    this.thesePieces[m][n] = this.oreo;
                                    if (this.evalSitu()['hasWon'] == this.oreo) {
                                        this.thesePieces[m][n] = this.empty;
                                        this.thesePieces[i][j] = this.empty;
                                        return {
                                            'aimIndexX': m,
                                            'aimIndexY': n,
                                            'finalScore': this.inf
                                        };
                                    }
                                    this.thesePieces[m][n] = this.empty;
                                }
                            }
                        }
                        this.thesePieces[i][j] = this.empty;

                        //-- 判断己方是否另外存在可成活四的位置
                        for (var m = 0; m < 15; m++) {
                            for (var n = 0; n < 15; n++) {
                                if (this.judgeWhetherCand(m, n) && !(m == i && n == j)) {
                                    this.thesePieces[m][n] = this.yoghurt;
                                    if (this.evalSitu()['willWin_4'] == this.yoghurt) {
                                        this.thesePieces[m][n] = this.empty;
                                        return {
                                            'aimIndexX': m,
                                            'aimIndexY': n,
                                            'finalScore': this.inf
                                        };
                                    }
                                    this.thesePieces[m][n] = this.empty;
                                }
                            }
                        }

                        //-- 判断对手下一步能否成活四
                        this.thesePieces[i][j] = this.yoghurt;
                        for (var m = 0; m < 15; m++) {
                            for (var n = 0; n < 15; n++) {
                                if (this.judgeWhetherCand(m, n)) {
                                    this.thesePieces[m][n] = this.oreo;
                                    if (this.evalSitu()['willWin_4'] == this.oreo) {
                                        this.thesePieces[m][n] = this.empty;
                                        this.thesePieces[i][j] = this.empty;
                                        return {
                                            'aimIndexX': m,
                                            'aimIndexY': n,
                                            'finalScore': this.inf
                                        };
                                    }
                                    this.thesePieces[m][n] = this.empty;
                                }
                            }
                        }
                        this.thesePieces[i][j] = this.empty;
                        //-- 否则落子此双三位置
                        return {
                            'aimIndexX': i,
                            'aimIndexY': j,
                            'finalScore': this.inf
                        };
                    } else { // 尝试快速阻拦
                        this.thesePieces[i][j] = this.oreo;
                        if (this.evalSitu()['hasWon'] == this.oreo) {
                            //-- 在决定阻拦前，判断己方是否存在可成五子的位置
                            this.thesePieces[i][j] = this.empty;
                            for (var m = 0; m < 15; m++) {
                                for (var n = 0; n < 15; n++) {
                                    if (this.judgeWhetherCand(m, n) && !(m == i && n == j)) {
                                        this.thesePieces[m][n] = this.yoghurt;
                                        if (this.evalSitu()['hasWon'] == this.yoghurt) {
                                            this.thesePieces[m][n] = this.empty;
                                            return {
                                                'aimIndexX': m,
                                                'aimIndexY': n,
                                                'finalScore': this.inf
                                            };
                                        }
                                        this.thesePieces[m][n] = this.empty;
                                    }
                                }
                            }
                            return {
                                'aimIndexX': i,
                                'aimIndexY': j,
                                'finalScore': this.inf
                            };
                        }
                        this.thesePieces[i][j] = this.empty;
                    }
                }

                //-- 正常的搜索逻辑
                this.thesePieces[i][j] = this.yoghurt;

                //-- 剪枝
                var tmpGotScore = aimDepth == 1 ? this.evalSitu()['score'] : this.chooseNextMove(aimDepth - 1, this.oreo, extreme['finalScore'], hashKey ^ this.zobristHash[i][j][0] ^ this.zobristHash[i][j][1])['finalScore'];
                this.thesePieces[i][j] = this.empty; // 还原

                if (tmpGotScore >= alphaOrBeta) {
                    //-- 更新置换表
                    this.transTable[hashKey] = {
                        'alpha': {
                            'considerDepth': aimDepth,
                            'aimIndexX': i,
                            'aimIndexY': j,
                            'finalScore': tmpGotScore
                        }
                    };

                    //-- 返回
                    return {
                        'aimIndexX': i,
                        'aimIndexY': j,
                        'finalScore': tmpGotScore
                    };
                } else {
                    extreme = extreme['finalScore'] < tmpGotScore ? {
                        'aimIndexX': i,
                        'aimIndexY': j,
                        'finalScore': tmpGotScore
                    } : extreme;
                }
            }
            this.transTable[hashKey] = {
                'alpha': {
                    'considerDepth': aimDepth,
                    'aimIndexX': extreme['aimIndexX'],
                    'aimIndexY': extreme['aimIndexY'],
                    'finalScore': extreme['finalScore']
                }
            };
            return extreme;
        } else {
            //-- 极小层
            if (this.transTable[hashKey] && this.transTable[hashKey]['beta']) {
                if (this.transTable[hashKey]['beta']['considerDepth'] >= aimDepth) {
                    return {
                        'aimIndexX': this.transTable[hashKey]['beta']['aimIndexX'],
                        'aimIndexY': this.transTable[hashKey]['beta']['aimIndexY'],
                        'finalScore': this.transTable[hashKey]['beta']['finalScore']
                    };
                }
            }

            var extreme = {
                'aimIndexX': this.inf,
                'aimIndexY': this.inf,
                'finalScore': this.inf
            };
            for (var c of this.getOrderedCand(whoseTurn, this.ratioLeftCand, this.thresholdCand)) {
                var i = c['aimIndexX'],
                    j = c['aimIndexY'];

                this.thesePieces[i][j] = this.oreo;

                if (aimDepth == this.considerDepth) {
                    //-- 绝杀等的讨论
                    var tmpRes = this.evalSitu();
                    if (tmpRes['hasWon'] == this.oreo) { // 成五
                        this.thesePieces[i][j] = this.empty;
                        return {
                            'aimIndexX': i,
                            'aimIndexY': j,
                            'finalScore': -this.inf
                        };
                    } else if (tmpRes['willWin_4'] == this.oreo) { // 活四
                        //-- 判断己方是否另外存在可成五子的位置
                        this.thesePieces[i][j] = this.empty;
                        for (var m = 0; m < 15; m++) {
                            for (var n = 0; n < 15; n++) {
                                if (this.judgeWhetherCand(m, n) && !(m == i && n == j)) {
                                    this.thesePieces[m][n] = this.oreo;
                                    if (this.evalSitu()['hasWon'] == this.oreo) {
                                        this.thesePieces[m][n] = this.empty;
                                        return {
                                            'aimIndexX': m,
                                            'aimIndexY': n,
                                            'finalScore': -this.inf
                                        };
                                    }
                                    this.thesePieces[m][n] = this.empty;
                                }
                            }
                        }
                        this.thesePieces[i][j] = this.oreo;
                        //-- 判断对手下一步能否成五子
                        for (var m = 0; m < 15; m++) {
                            for (var n = 0; n < 15; n++) {
                                if (this.judgeWhetherCand(m, n)) {
                                    this.thesePieces[m][n] = this.yoghurt;
                                    if (this.evalSitu()['hasWon'] == this.yoghurt) {
                                        this.thesePieces[m][n] = this.empty;
                                        this.thesePieces[i][j] = this.empty;
                                        return {
                                            'aimIndexX': m,
                                            'aimIndexY': n,
                                            'finalScore': -this.inf
                                        };
                                    }
                                    this.thesePieces[m][n] = this.empty;
                                }
                            }
                        }
                        this.thesePieces[i][j] = this.empty;
                        //-- 否则落子此活四位置
                        return {
                            'aimIndexX': i,
                            'aimIndexY': j,
                            'finalScore': -this.inf
                        };
                    } else if (tmpRes['willWin_3'] == this.oreo) { // 双三
                        //-- 判断己方是否另外存在可成五子的位置
                        this.thesePieces[i][j] = this.empty;
                        for (var m = 0; m < 15; m++) {
                            for (var n = 0; n < 15; n++) {
                                if (this.judgeWhetherCand(m, n) && !(m == i && n == j)) {
                                    this.thesePieces[m][n] = this.oreo;
                                    if (this.evalSitu()['hasWon'] == this.oreo) {
                                        this.thesePieces[m][n] = this.empty;
                                        return {
                                            'aimIndexX': m,
                                            'aimIndexY': n,
                                            'finalScore': -this.inf
                                        };
                                    }
                                    this.thesePieces[m][n] = this.empty;
                                }
                            }
                        }
                        this.thesePieces[i][j] = this.oreo;
                        //-- 判断对手下一步能否成五子
                        for (var m = 0; m < 15; m++) {
                            for (var n = 0; n < 15; n++) {
                                if (this.judgeWhetherCand(m, n)) {
                                    this.thesePieces[m][n] = this.yoghurt;
                                    if (this.evalSitu()['hasWon'] == this.yoghurt) {
                                        this.thesePieces[m][n] = this.empty;
                                        this.thesePieces[i][j] = this.empty;
                                        return {
                                            'aimIndexX': m,
                                            'aimIndexY': n,
                                            'finalScore': -this.inf
                                        };
                                    }
                                    this.thesePieces[m][n] = this.empty;
                                }
                            }
                        }

                        this.thesePieces[i][j] = this.empty;
                        //-- 判断己方是否另外存在可成活四的位置
                        for (var m = 0; m < 15; m++) {
                            for (var n = 0; n < 15; n++) {
                                if (this.judgeWhetherCand(m, n) && !(m == i && n == j)) {
                                    this.thesePieces[m][n] = this.oreo;
                                    if (this.evalSitu()['willWin_4'] == this.oreo) {
                                        this.thesePieces[m][n] = this.empty;
                                        return {
                                            'aimIndexX': m,
                                            'aimIndexY': n,
                                            'finalScore': -this.inf
                                        };
                                    }
                                    this.thesePieces[m][n] = this.empty;
                                }
                            }
                        }

                        this.thesePieces[i][j] = this.oreo;
                        //-- 判断对手下一步能否成活四
                        for (var m = 0; m < 15; m++) {
                            for (var n = 0; n < 15; n++) {
                                if (this.judgeWhetherCand(m, n)) {
                                    this.thesePieces[m][n] = this.yoghurt;
                                    if (this.evalSitu()['willWin_4'] == this.yoghurt) {
                                        this.thesePieces[m][n] = this.empty;
                                        this.thesePieces[i][j] = this.empty;
                                        return {
                                            'aimIndexX': m,
                                            'aimIndexY': n,
                                            'finalScore': -this.inf
                                        };
                                    }
                                    this.thesePieces[m][n] = this.empty;
                                }
                            }
                        }

                        this.thesePieces[i][j] = this.empty;
                        //-- 否则落子此双三位置
                        return {
                            'aimIndexX': i,
                            'aimIndexY': j,
                            'finalScore': -this.inf
                        };
                    } else {
                        this.thesePieces[i][j] = this.yoghurt;
                        if (this.evalSitu()['hasWon'] == this.yoghurt) {
                            //-- 在决定阻拦前，判断己方是否存在可成五子的位置
                            this.thesePieces[i][j] = this.empty;
                            for (var m = 0; m < 15; m++) {
                                for (var n = 0; n < 15; n++) {
                                    if (this.judgeWhetherCand(m, n) && !(m == i && n == j)) {
                                        this.thesePieces[m][n] = this.oreo;
                                        if (this.evalSitu()['hasWon'] == this.oreo) {
                                            this.thesePieces[m][n] = this.empty;
                                            return {
                                                'aimIndexX': m,
                                                'aimIndexY': n,
                                                'finalScore': -this.inf
                                            };
                                        }
                                        this.thesePieces[m][n] = this.empty;
                                    }
                                }
                            }
                            return {
                                'aimIndexX': i,
                                'aimIndexY': j,
                                'finalScore': -this.inf
                            };
                        }
                        this.thesePieces[i][j] = this.empty;
                    }
                }


                //-- 正常的搜索逻辑
                this.thesePieces[i][j] = this.oreo;

                //-- 剪枝
                var tmpGotScore = aimDepth == 1 ? this.evalSitu()['score'] : this.chooseNextMove(aimDepth - 1, this.yoghurt, extreme['finalScore'], hashKey ^ this.zobristHash[i][j][0] ^ this.zobristHash[i][j][2])['finalScore'];
                this.thesePieces[i][j] = this.empty; // 还原

                if (tmpGotScore <= alphaOrBeta) {
                    this.transTable[hashKey] = {
                        'beta': {
                            'considerDepth': aimDepth,
                            'aimIndexX': i,
                            'aimIndexY': j,
                            'finalScore': tmpGotScore
                        }
                    };

                    return {
                        'aimIndexX': i,
                        'aimIndexY': j,
                        'finalScore': tmpGotScore
                    };
                } else {
                    extreme = extreme['finalScore'] > tmpGotScore ? {
                        'aimIndexX': i,
                        'aimIndexY': j,
                        'finalScore': tmpGotScore
                    } : extreme;
                }
            }
            this.transTable[hashKey] = {
                'beta': {
                    'considerDepth': aimDepth,
                    'aimIndexX': extreme['aimIndexX'],
                    'aimIndexY': extreme['aimIndexY'],
                    'finalScore': extreme['finalScore']
                }
            };
            return extreme;
        }
    }
}