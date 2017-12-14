import { Injectable } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx';
import * as d3 from 'd3';

@Injectable()
export class GraphingService {

    public trackPosition: number;
    public trackAnalysis: any;
    public sections: any[];
    public sectionNumber = 0;
    public inputs: number[] = [];

    _barChart: d3.Selection<any, any, any, any>;
    _barWidth: number;
    _barWidthCumu = 0;

    barChart(input: number): void {
        d3.select('#graph').selectAll('svg').remove();
        this._barWidthCumu = 0;
        this.inputs.push(input);
        console.log('bar chart triggered');
        if (this.trackAnalysis) {
            this._barWidth = parent.innerWidth / this.trackAnalysis.bars.length;
        } else {
            this._barWidth = parent.innerWidth;
        }

        this._barChart = d3.select('#graph').append('svg:svg')
            .attr('width', parent.innerWidth)
            .attr('height', parent.innerHeight)
            .append('svg:g');


        this.inputs.pop();
    }

    addBars(input: number): void {
        this.inputs.push(input);

        this._barChart.selectAll('g.rect').data(this.inputs)
            .enter().append('rect')
            .attr('style', 'opacity:0.5')
            .attr('width', this._barWidth)
            .attr('height', (data: number) => { return data * 2000 + (20 * (Math.random() - 0.5)); })
            .attr('x', (data: number, i: number) => {
                this._barWidthCumu += this._barWidth;
                return this._barWidthCumu;
            });
        // .attr("y", (data: number) => { return data * 1000; });

        this.inputs.pop();
        if (this._barWidth > 1000) {
            this.barChart(-10);
        }
    }

}

type d3Node = {
    id: string;
    xval: number;
    yval: number;
};

type d3Link = {
    source: string;
    target: string;
    value: number;
};

type Graph = {
    nodes: d3Node[],
    links: d3Link[];
};