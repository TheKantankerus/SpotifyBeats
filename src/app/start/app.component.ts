import { Component } from "@angular/core";
import { Observable } from 'rxjs/Observable';
import { Subscription } from "rxjs/Subscription";
import * as $ from "jquery";
import { VisualizerService } from '../visualizer/visualizer.service';
import { GraphingService } from "../visualizer/graphing.service";

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  providers: [VisualizerService, GraphingService]
})
export class AppComponent {

  constructor(private viz: VisualizerService, private graph: GraphingService) {
    let interval: Observable<number> = Observable.interval(2000);

    interval.subscribe(
      (data) => this.validateAuthentication(),
      (err) => console.log("Error! " + err),
      () => console.log("Completed!")
    );

    // this.viz.switcher();
  }

  authToken: string;
  clientId = "c3720752fc71445eb83d734b369f34a8";
  redirectUri: string = "https://sleepy-citadel-97880.herokuapp.com/callback";
  scopes: string[] = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state"
  ];

  sections: any[];
  sectionNumber = 0;

  trackURI: string;
  trackPlaying = false;
  trackDuration: number;
  trackPosition: number;
  artistName: string;
  albumName: string;
  trackName: string;
  albumImageURL: string;
  albumURI: string;
  pollDebounce: number;
  accessToken: string;
  loggedIn: boolean;

  login(): void {
    let url: string = "https://accounts.spotify.com/authorize/?client_id=" + this.clientId +
      "&redirect_uri=" + encodeURIComponent(this.redirectUri) +
      "&scope=" + this.scopes.join("%20") +
      "&response_type=token";
    console.log("login url", url);
    location.href = url;
  }

  createRequest(method: string, url: string, onload: any): XMLHttpRequest {
    let request: XMLHttpRequest = new XMLHttpRequest();
    request.open(method, url);
    if (method !== 'GET') {
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    }
    request.onerror = () => { return; };
    request.onload = onload.bind(this, request);
    return request;
  }

  createAuthorizedRequest(method: string, url: string, onload: any): XMLHttpRequest {
    let request: XMLHttpRequest = this.createRequest(method, url, onload);
    request.setRequestHeader('Authorization', 'Bearer ' + this.accessToken);
    return request;
  }

  validateAuthentication(): void {
    console.log('location.hash', location.hash);
    let lochash: string = location.hash.substr(1);
    let newAccessToken: string = lochash.substr(lochash.indexOf('access_token=')).split('&')[0].split('=')[1];
    if (newAccessToken) {
      localStorage.setItem('access_token', newAccessToken);
      this.accessToken = newAccessToken;
    } else {
      this.accessToken = localStorage.getItem('access_token');
    }
    if (this.accessToken) {
      this.connect();
      this.viz.loggedIn = true;
      this.loggedIn = true;
    } else {
      this.showLogin();
    }
  }

  connect(): void {
    console.log('Connecting with access token: ' + this.accessToken);
    this.getUserInformation((userinfo: any) => {
      if (!userinfo) {
        this.accessToken = '';
        this.showLogin();
        return;
      }

      this.hideLogin();
      // this.toast("Hello " + (userinfo.display_name || userinfo.id) + "!", "Make sure you're playing something in Spotify!");
      this.pollCurrentlyPlaying(1000);
    });
  }

  getUserInformation(callback: any): void {
    this.createAuthorizedRequest('GET', 'https://api.spotify.com/v1/me', (request: any) => {
      if (request.status < 200 || request.status >= 400) {
        callback(null);
        return;
      }

      if (request.status === 204) {
        console.log('NO TRACK PLAYING');
        return;
      }

      // console.log("got data", request.responseText);
      let data: any = JSON.parse(request.responseText);
      callback(data);
    }).send();
  }

  showLogin(): void {
    document.getElementById('biglogin').style.display = 'block';
  }

  hideLogin(): void {
    document.getElementById('biglogin').style.display = 'none';
  }

  pollCurrentlyPlaying(delay: number): void {
    if (this.pollDebounce) {
      clearTimeout(this.pollDebounce);
    }
    this.pollDebounce = setTimeout(
      this._pollCurrentlyPlaying.bind(this, this.pollCurrentlyPlaying.bind(this)),
      delay || 5000);
  }

  _pollCurrentlyPlaying(callback: any): void {
    global.gc();
    this.createAuthorizedRequest(
      'GET',
      'https://api.spotify.com/v1/me/player/currently-playing',
      (request: any) => {
        if (request.status < 200 || request.status >= 400) {
          callback();
          return;
        }

        if (request.status === 204) {
          console.log('NO TRACK PLAYING');
          return;
        }

        let data: any = JSON.parse(request.responseText);
        console.log('got data', data);
        if (data.item) {
          this.albumURI = data.item.album.uri;
          this.albumImageURL = data.item.album.images[0].url;
          this.trackName = data.item.name;
          this.albumName = data.item.album.name;
          this.artistName = data.item.artists[0].name;
          this.setNowPlayingTrack(data.item.uri);
          this.trackPosition = data.progress_ms;
          this.trackDuration = data.item.duration_ms;
          this.trackPlaying = data.is_playing;

          const theSection: any = this.sections[this.sectionNumber];

          if (this.viz.secStart <= this.trackPosition / 1000 && theSection) {
            this.viz.tempo = theSection.tempo;
            this.viz.loudness = theSection.loudness;
            this.viz.secStart = theSection.start;
            this.viz.setBeat();
            this.viz.beat = 1;
            this.sectionNumber++;

            this.viz.switcher();
            document.getElementById('total-container').style.background = this.viz.getRandomColor();
            $('h1').css({ 'opacity': 0 });

            console.log('analysis: section number: ' + this.sectionNumber + ' -- tempo: '
              + this.viz.tempo + ' -- loudness: ' + this.viz.loudness
              + ' -- SecStart: ' + this.viz.secStart);
          }

        }
        callback();
      }
    ).send();
  }

  setNowPlayingTrack(uri: string): any {
    if (uri === this.trackURI) {
      return;
    }

    this.trackURI = uri;
    this.graph.trackAnalysis = null;

    // this.toast(this.trackName, this.artistName + " - " + this.albumName);
    this.fetchTrackAnalysis();
    this.sectionNumber = 0;
    this.viz.secStart = 0;
    this.viz.counter = 0;
    this.viz.newChart = true;
    this.graph.inputs = [];
  }

  fetchTrackAnalysis(): void {
    let id: string = this.trackURI.split(':')[2];
    this.createAuthorizedRequest('GET', 'https://api.spotify.com/v1/audio-analysis/' + id, (request: any) => {
      if (request.status < 200 || request.status >= 400) {
        // callback(null);
        return;
      }

      if (request.status === 204) {
        console.log('NO TRACK PLAYING');
        return;
      }

      const data: any = JSON.parse(request.responseText);
      console.log('got analysis data', data);
      this.graph.trackAnalysis = data;
      this.sections = data.sections;
      // callback(data);
    }).send();

  }

}
