import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/of';
import { Subscription } from "rxjs/Subscription";
import * as $ from "jquery";
import { GraphingService } from "./graphing.service";

@Injectable()
export class VisualizerService {

    constructor(private graph: GraphingService) { }

    beatInterval = Observable.of(null).switchMap(e => this.setBeat())
        .switchMap(r => this.getBeat()).repeat();

    public tempo: number = 120;
    public loudness: number = -Infinity;
    public secStart: number = 0;
    public newChart: boolean = true;

    loggedIn: boolean = false;

    counter: number = 0;
    beat: number = 1;

    makeSquare(): void {
        this.beatInterval.takeWhile(() => (this.counter % 3 === 0))
            .subscribe((data) => {
                let div: HTMLElement = document.createElement("div");
                div.id = data.toString();
                div.className = "square";
                // div.style.width = (Math.random() * 1000).toString() + "px";
                div.style.height = (Math.random() * parent.innerHeight).toString() + 'px';
                div.style.background = this.getRandomColor();
                div.style.color = this.getRandomColor();
                div.style.position = "absolute";
                div.style.top = (Math.random() * parent.innerHeight / 2).toString() + "px";
                div.style.width = '100%';
                // div.style.left = (Math.random() * 500).toString() + "px";
                div.style.opacity = (0.2 + 2 / Math.abs(this.loudness)).toString();

                div.style.fontSize = div.style.height;
                div.style.fontFamily = this.getRandomFontFamily();
                div.style.fontWeight = this.getRandomFontWeight();

                div.style.textAlign = 'center';
                div.style.lineHeight = div.style.height;

                div.style.zIndex = (this.counter + 6).toString();

                div.innerHTML = (1 + this.beat % 4).toString();
                this.beat++;

                document.getElementById('sq-container').appendChild(div);

                this.setGraph();

                setTimeout(() => {
                    div.remove();
                }, (4 * 4 / (this.tempo / 60)) * 1000);

            }, (err) => console.log('Error! ' + err), () => console.log('Completed!'));

    }

    quarters(): void {
        this.beatInterval.takeWhile(() => (this.counter % 3 === 1))
            .subscribe((data) => {
                const div: HTMLElement = document.createElement('div');
                div.id = data.toString();
                div.className = 'quarter';
                div.style.width = '50%';
                div.style.height = '50%';

                div.style.fontSize = (parent.screen.height / 2.25).toString() + 'px';
                div.style.fontFamily = this.getRandomFontFamily();
                div.style.fontWeight = this.getRandomFontWeight();
                div.style.lineHeight = '1';

                div.style.textAlign = 'center';
                div.style.verticalAlign = 'top';
                div.style.padding = '0px';
                div.style.background = this.getRandomColor('lo');
                div.style.color = this.getRandomColor('hi');
                div.style.position = 'absolute';

                div.style.zIndex = this.counter.toString();

                switch (1 + this.beat % 4) {
                    case 1: {
                        div.style.top = '0px';
                        div.style.left = '0px';
                        break;
                    }
                    case 2: {
                        div.style.top = '0px';
                        div.style.right = '0px';
                        break;
                    }
                    case 3: {
                        div.style.bottom = '0px';
                        div.style.right = '0px';
                        break;
                    }
                    case 4: {
                        div.style.bottom = '0px';
                        div.style.left = '0px';
                        break;
                    }
                    default: {
                        console.log('5 beats?!');
                    }
                }

                this.setGraph();

                div.innerHTML = (1 + this.beat % 4).toString();
                this.beat++;

                document.getElementById('quart-container').appendChild(div);

                setTimeout(() => {
                    div.remove();
                }, (2 * 4 / (this.tempo / 60)) * 1000);

            }, (err) => console.log('Error! ' + err), () => console.log('Completed!'));
    }

    _divCount = 0;

    tunnel(): void {
        this.beatInterval.takeWhile(() => (this.counter % 3 === 2))
            .subscribe((data) => {
                let div: HTMLElement = document.createElement('div');
                div.id = 'tunnel' + this._divCount;
                div.className = 'tunnel';

                div.style.backgroundColor = this._divCount % 2 === 0 ? this.getRandomColor('lo') : this.getRandomColor('hi');
                div.style.zIndex = '-1';

                div.style.padding = '25px';
                div.style.height = parent.innerHeight.toString();
                div.style.width = parent.innerWidth.toString();

                if (this._divCount < 1) {
                    document.getElementById('tunnel-container').appendChild(div);
                } else if (this._divCount > 10) {
                    const tunA: string = 'tunnel' + (this._divCount % 10);
                    const tunB: string = 'tunnel' + (this._divCount % 10 + 1);
                    const tunC: string = 'tunnel' + (10 - this._divCount % 10);
                    const swap: string = document.getElementById(tunA).style.backgroundColor;
                    document.getElementById(tunA).style.backgroundColor = document.getElementById(tunB).style.backgroundColor;
                    document.getElementById(tunC).style.backgroundColor = swap;
                    document.getElementById(tunB).style.backgroundColor = this.getRandomColor();

                } else {
                    div.style.margin = '25px';
                    document.getElementById('tunnel' + (this._divCount - 1)).appendChild(div);
                }

                this._divCount++;

                this.beat++;
                this.setGraph();

            }, (err) => console.log('Error! ' + err), () => console.log('Completed!'));
    }

    switcher(): void {
        global.gc();
        let rando: number = Math.floor(Math.random() * 3);

        while (rando === this.counter) {
            rando = Math.floor(Math.random() * 3);
        }

        this.counter = rando;

        switch (this.counter) {

            case 0: {
                this.makeSquare();
                console.log('switch to MAKESQUARE at ' + this.secStart);
                break;
            }
            case 1: {
                this.quarters();
                console.log('switch to QUARTERS at ' + this.secStart);
                break;
            }
            case 2: {
                // $("div").remove(".quarter");
                if (this._divCount > 20) {
                    $('#tunnel0').remove();
                    this._divCount = 0;
                }
                this.tunnel();
                console.log('switch to TUNNEL at ' + this.secStart);
                break;
            }
            default: {
                console.log('switch to Something weird happened!' + this.counter);
                break;
            }
        }

        if (this.counter > 100) {
            this.counter = 0;
        }
    }


    getBeat(): Observable<number> { return Observable.of((1 / (this.tempo / 60)) * 1000 * 4 * 16); }
    setBeat(): Observable<number> { return Observable.timer((1 / (this.tempo / 60)) * 1000); }

    setGraph(): void {
        if (this.newChart) {
            this.graph.barChart(1 / Math.abs(this.loudness));
            this.newChart = false;
        }
        if (this.beat % 4 === 0) {
            this.graph.addBars(1 / Math.abs(this.loudness));
        }
    }

    getRandomColor(arg?: string): string {
        let letters = '0123456789ABCDEF';

        if (arg === 'lo') {
            letters = letters.substr(0, 12);
        }
        if (arg === 'hi') {
            letters = letters.substr(4, 12);
        }

        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * letters.length)];
        }
        return color;
    }

    getRandomFontFamily(): string {
        const fontFamilies: string[] = [
            'Times New Roman', 'Verdana', 'Helvetica',
            'Bookman', 'OCR A Std', 'Comic Sans',
            'Papyrus', 'Impact', 'Jazz LET'
        ];
        return fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
    }

    getRandomFontWeight(): string {
        const fontWeights: string[] = [
            '100', '400', '800', '1200'
        ];
        return fontWeights[Math.floor(Math.random() * fontWeights.length)];
    }
}
