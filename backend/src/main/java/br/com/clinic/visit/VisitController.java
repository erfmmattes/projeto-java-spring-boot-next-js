package br.com.clinic.visit;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/visits")
public class VisitController {
    private final VisitService service;
    public VisitController(VisitService service) { this.service = service; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VisitResponse create(@Valid @RequestBody VisitRequest request) { return service.create(request); }

    @GetMapping("/{id}")
    public VisitResponse get(@PathVariable long id) { return service.get(id); }

    @GetMapping
    public List<VisitResponse> list() { return service.list(); }
}

