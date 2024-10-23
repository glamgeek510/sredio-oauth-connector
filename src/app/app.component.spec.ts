import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { GithubService } from './services/github.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let githubServiceSpy: jasmine.SpyObj<GithubService>;

  beforeEach(async () => {
    githubServiceSpy = jasmine.createSpyObj('GithubService', ['connect', 'disconnect']);

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatCardModule, MatExpansionModule, NoopAnimationsModule],
      declarations: [AppComponent],
      providers: [{ provide: GithubService, useValue: githubServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.connected).toBeFalse();
    expect(component.user).toBeNull();
    expect(component.open).toBe(1);
    expect(component.githubLogoImage).toBe('/assets/img/github-logo/github_logo-words.png');
    expect(component.githubRoundLogoImage).toBe('/assets/img/github-mark/github-logo-mark.png');
  });

  describe('connect', () => {
    it('should call GithubService.connect() and update open property', async () => {
      const consoleLogSpy = spyOn(console, 'log');
      await component.connect();
      expect(githubServiceSpy.connect).toHaveBeenCalled();
      expect(component.open).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith('Connecting...');
    });
  });

  describe('disconnect', () => {
    it('should call GithubService.disconnect() and update properties on success', async () => {
      githubServiceSpy.disconnect.and.returnValue(of(null));
      const consoleLogSpy = spyOn(console, 'log');
      
      await component.disconnect();
      
      expect(githubServiceSpy.disconnect).toHaveBeenCalled();
      expect(component.connected).toBeFalse();
      expect(component.user).toBeNull();
      expect(consoleLogSpy).toHaveBeenCalledWith('Disconnected successfully');
    });

    it('should handle errors when disconnecting', async () => {
      const error = new Error('Disconnection failed');
      githubServiceSpy.disconnect.and.returnValue(throwError(() => error));
      const consoleErrorSpy = spyOn(console, 'error');
      
      await component.disconnect();
      
      expect(githubServiceSpy.disconnect).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Disconnection failed:', error);
      expect(component.connected).toBeFalse();
      expect(component.user).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should set connected to true and update user when URL has connected=true', () => {
      const searchParams = new URLSearchParams('?connected=true&user=testUser');
      spyOn(window, 'URLSearchParams').and.returnValue(searchParams);
      
      component.ngOnInit();
      
      expect(component.connected).toBeTrue();
      expect(component.user).toBe('testUser');
    });

    it('should keep connected as false and user as null when URL has connected=false', () => {
      const searchParams = new URLSearchParams('?connected=false');
      spyOn(window, 'URLSearchParams').and.returnValue(searchParams);
      
      component.ngOnInit();
      
      expect(component.connected).toBeFalse();
      expect(component.user).toBeNull();
    });

    it('should keep default values when URL has no relevant parameters', () => {
      const searchParams = new URLSearchParams('');
      spyOn(window, 'URLSearchParams').and.returnValue(searchParams);
      
      component.ngOnInit();
      
      expect(component.connected).toBeFalse();
      expect(component.user).toBeNull();
    });
  });
});
