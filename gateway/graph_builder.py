from collections import Counter, defaultdict
from typing import Any


def _link_key(value: str) -> str:
    return value.strip().removesuffix(".md").lower()


class GraphBuilder:
    def build_graph(self, notes_with_links: list[dict[str, Any]], max_nodes: int = 250) -> dict[str, Any]:
        max_nodes = max(1, min(int(max_nodes or 250), 1000))
        notes = notes_with_links or []
        lookup: dict[str, str] = {}
        node_meta: dict[str, dict[str, Any]] = {}

        for note in notes:
            node_id = note.get("file") or note.get("title")
            if not node_id:
                continue
            title = note.get("title") or str(node_id).rsplit("/", 1)[-1].removesuffix(".md")
            node_meta[node_id] = {
                "id": node_id,
                "title": title,
                "folder": note.get("folder") or "Root",
                "tags": note.get("tags", []),
                "connections": 0,
            }
            lookup[_link_key(str(title))] = node_id
            lookup[_link_key(str(node_id))] = node_id
            lookup[_link_key(str(node_id).rsplit("/", 1)[-1])] = node_id

        edges_seen: set[tuple[str, str]] = set()
        connection_counts: Counter[str] = Counter()

        for note in notes:
            source = note.get("file") or note.get("title")
            if source not in node_meta:
                continue
            for raw_target in note.get("links") or note.get("wikilinks") or []:
                target = lookup.get(_link_key(str(raw_target)))
                if not target or target == source:
                    continue
                edge = (source, target)
                if edge in edges_seen:
                    continue
                edges_seen.add(edge)
                connection_counts[source] += 1
                connection_counts[target] += 1

        ranked_ids = sorted(
            node_meta,
            key=lambda node_id: (connection_counts[node_id], node_meta[node_id]["title"].lower()),
            reverse=True,
        )
        selected_ids = set(ranked_ids[:max_nodes])

        nodes = []
        for node_id in ranked_ids[:max_nodes]:
            node = dict(node_meta[node_id])
            node["connections"] = connection_counts[node_id]
            nodes.append(node)

        edges = [
            {"source": source, "target": target}
            for source, target in sorted(edges_seen)
            if source in selected_ids and target in selected_ids
        ]

        community_counts: defaultdict[str, int] = defaultdict(int)
        for node in nodes:
            community_counts[node["folder"] or "Root"] += 1
        communities = [
            {"label": label, "size": size}
            for label, size in sorted(community_counts.items(), key=lambda item: item[1], reverse=True)
        ]

        return {
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "communities": len(communities),
                "source_notes": len(notes),
            },
            "communities": communities,
        }


def build_graph(notes_with_links: list[dict[str, Any]], max_nodes: int = 250) -> dict[str, Any]:
    return GraphBuilder().build_graph(notes_with_links, max_nodes=max_nodes)
