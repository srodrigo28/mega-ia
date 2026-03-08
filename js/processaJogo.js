const numerosApostados = [];
const resultado = [];
let valorAposta = 0;
let qtdAcertos = 0;

const btnApostar = document.getElementById('btnApostar');
btnApostar.disabled = true;

sortearNumeros();

function sortearNumeros(){
    while (resultado.length < 6) {
        const numeroSorteado = Math.floor(Math.random() * 60) + 1;
        if (resultado.includes(numeroSorteado)) {
            continue;
        }
        resultado.push(numeroSorteado);
    }
}
function selecionarNumeros(numero){

    if(numerosApostados.length >= 0 && numerosApostados.length < 15){
        // adiciona o numero na lista
        numerosApostados.push(numero)

        // desabilita o numero escolhido
        desabilitarNumeroEscolhido(numero);

        // habilita o botão quando a lista por maior que 5
        if(numerosApostados.length > 5){
            btnApostar.disabled = false;

            // mostra o valor da aposta
            valorDaAposta();

        }
        
        // mostrar quantidade de números apostados
        const qtdApostas = document.getElementById("qtdNumeros");
        qtdApostas.innerHTML = `<p> Qtd Números</p> <p class='valor'>${numerosApostados.length}</p> `

        // mostra o valor da aposta
        
    }
}
function desabilitarNumeroEscolhido(numero){
    document.getElementById("num_"+numero).disabled = true;
    document.getElementById("num_"+numero).style.color = "#fff"
    document.getElementById("num_"+numero).style.background = "#009e4c"
}
function valorDaAposta(){
    switch(numerosApostados.length){
        case 6: 
            valorAposta = "R$ 4,50"
            break;
        case 7: 
            valorAposta = "R$ 31,50"
            break;
        case 8: 
            valorAposta = "R$ 126,00"
            break;
        case 9: 
            valorAposta = "R$ 378,00"
            break;
        case 10: 
            valorAposta = "R$ 945,00"
            break;
        case 11: 
            valorAposta = "R$ 2.079,00"
            break;
        case 12: 
            valorAposta = "R$ 4.158,00"
            break;
        case 13: 
            valorAposta = "R$ 6.006,00"
            break;
        case 14: 
            valorAposta = "R$ 10.510,50"
            break;
        case 15: 
            valorAposta = "R$ 17.517,50"
            break;
        default: valorAposta = "R$ 0,00"
            break;
    }
    const divValorAposta = document.getElementById("valor");
    divValorAposta.innerHTML = `<p>Valor da Aposta</p> <p class="valor">${valorAposta}</p>`;
    // console.log(divValorAposta);

}
function apostar() {
    qtdAcertos = 0;

    // fazer a aposta comparar as duas listas
    for (let i = 0; i < numerosApostados.length; i++){
        if (resultado.includes(numerosApostados[i])) {
            qtdAcertos++;
        }
    }
    // mostrar o resultado
    const divResultado = document.getElementById("resultado");
    divResultado.innerHTML = "";
    for (let i = 0; i < resultado.length; i++){
        divResultado.innerHTML += "<div class='resultadoCicle'>" + resultado[i] + "</div>";
       
    }

    // Mostrar a quantidade de acertos
    let divAcertos = document.getElementById("acertos")
    divAcertos.innerHTML = "<p class='valor'>" + qtdAcertos + "</p>"

    desarbilitarApostar();
    desarbilitarTodosNumeros();

    // habilita o botão reinicar
    document.getElementById("btnReiniciar").style.display = 'inline';
}

function desarbilitarTodosNumeros() {
    for (let i = 1; i <= 60; i++){
        document.getElementById("num_"+i).disabled = true;
    }
}
function desarbilitarApostar() {
        document.getElementById("btnApostar").disabled = true;
}

// Aciona o atualizar a página
let btn = document.querySelector("#btnReiniciar");
btn.addEventListener("click", function (){
    location.reload();
});
