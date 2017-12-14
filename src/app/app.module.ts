import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './start/app.component';
import { HttpModule } from '@angular/http';

import { VisualizerService } from './visualizer/visualizer.service';
import { GraphingService } from './visualizer/graphing.service';
@NgModule({
    imports: [
        BrowserModule,
        HttpModule
    ],
    declarations: [
        AppComponent
    ],
    providers: [
        VisualizerService,
        GraphingService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
