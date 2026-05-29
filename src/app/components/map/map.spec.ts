import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChanges } from '@angular/core';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import * as L from 'leaflet';
import { Map as MapComponent } from './map';

describe('Map Component Tests', () => {

  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {

    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [MapComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);

    component = fixture.componentInstance;

    fixture.detectChanges();

  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create map component', () => {
    expect(component).toBeTruthy();
  })

  it('should reset map to initial position', () => {
    component['map'] = {
      setView: vi.fn()
    } as any;
    component.resetMap();
    expect(component['map'].setView).toHaveBeenCalledWith({ lat: 47.0000, lng: 2.3522 }, 6);
  });

  it('should clear all markers', () => {

    const removeLayerMock = vi.fn();
    component['map'] = {
      removeLayer: removeLayerMock
    } as any;
    component.markers = [
      {} as any,
      {} as any
    ];
    component['poisBounds'] = [
      [1,2],
      [3,4]
    ];
    component.clearMarkers();
    expect(removeLayerMock).toHaveBeenCalledTimes(2);
    expect(component.markers.length).toBe(0);
    expect(component['poisBounds'].length).toBe(0);
  });

  it('should translate opening days to french', () => {
    const result = component.formatOpeningHours(
      'Mo-Fr 09:00-18:00'
    );
    expect(result).toContain('Lun');
    expect(result).toContain('Ven');
  });

  it('should center map when selectionPlace changes', () => {
    const fakeMarker = {
      addTo: () => fakeMarker
    };
    (component as any).map = {
      setView: vi.fn(),
      removeLayer: vi.fn(),
      addLayer: vi.fn()
    };
    component.newMapCenter = fakeMarker as any;
    const changes = {
      selectionPlace: {
        currentValue: [
          {
            lat: 48.8566,
            lon: 2.3522
          }
        ]
      }
    };
    component.ngOnChanges(changes as any);
    expect(component['map'].setView).toHaveBeenCalledWith([48.8566, 2.3522]);
  });
});